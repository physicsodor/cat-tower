import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";
import type { ChainMap } from "@/features/subject/types/Chain/chainOp";
import type { FamilyMap } from "@/features/subject/types/Family/familyOp";

const DEF_W = 72; // fallback: min-width 4.5rem @ 16px
const DEF_H = 40; // fallback estimated height
const GAP = 32; // 2rem

/**
 * Computes auto-layout positions for all SUBJECT nodes.
 *
 * @param sizes - Actual world-coordinate dimensions per node idx.
 *                When provided, used instead of defaults (no overlap guaranteed).
 *
 * Rules:
 * - Pre nodes placed above (smaller y) current nodes.
 * - level(node) = 1 + max(level(pre)) — nearest pre is exactly one row above.
 * - Each node is horizontally centered over its direct layout children (nxt at level+1).
 * - Subtree width = max(nodeWidth, sum(childSubtreeWidths) + GAP*(n-1)).
 * - Layout is top-down: roots first, children spread evenly under each parent.
 * - For DAG nodes with multiple parents, the first parent in tree order "owns" the subtree.
 * - Clusters arranged left-to-right, all starting at y = 0.
 */
export const computeAutoLayout = (
  list: ReadonlyArray<Curriculum>,
  idx2chain: ChainMap,
  idx2family: FamilyMap,
  sizes?: Map<number, { w: number; h: number }>,
): Map<number, { x: number; y: number }> => {
  const getW = (idx: number) => sizes?.get(idx)?.w ?? DEF_W;
  const getH = (idx: number) => sizes?.get(idx)?.h ?? DEF_H;

  // 1. Collect all SUBJECT indices
  const subjectSet = new Set<number>();
  for (const item of list) {
    if (item.sbjType === "SUBJECT") subjectSet.add(item.idx);
  }

  // 2. DFS tree traversal → tree-order list
  const treeOrder: number[] = [];
  const visitTree = (momIdx: number) => {
    for (const k of idx2family.get(momIdx)?.kids ?? []) {
      if (subjectSet.has(k)) treeOrder.push(k);
      visitTree(k);
    }
  };
  visitTree(-1);

  const treeRank = new Map(treeOrder.map((idx, i) => [idx, i]));

  // 3. Find connected components via pre/nxt edges (BFS)
  const visited = new Set<number>();
  const components: number[][] = [];
  for (const idx of treeOrder) {
    if (visited.has(idx)) continue;
    const comp: number[] = [];
    const queue = [idx];
    while (queue.length > 0) {
      const cur = queue.pop()!;
      if (visited.has(cur) || !subjectSet.has(cur)) continue;
      visited.add(cur);
      comp.push(cur);
      const chain = idx2chain.get(cur);
      if (chain?.pre)
        for (const p of chain.pre) if (!visited.has(p)) queue.push(p);
      if (chain?.nxt)
        for (const n of chain.nxt) if (!visited.has(n)) queue.push(n);
    }
    components.push(comp);
  }

  // 4. Assign levels: level = 1 + max(pre levels), base = 0
  const levelMemo = new Map<number, number>();
  const getLevel = (idx: number): number => {
    if (levelMemo.has(idx)) return levelMemo.get(idx)!;
    const pre = idx2chain.get(idx)?.pre;
    const level =
      pre && pre.size > 0 ? 1 + Math.max(...Array.from(pre).map(getLevel)) : 0;
    levelMemo.set(idx, level);
    return level;
  };
  for (const idx of treeOrder) getLevel(idx);

  // 5. Subtree-based top-down layout per component
  const result = new Map<number, { x: number; y: number }>();
  let clusterOffsetX = 0;

  for (const comp of components) {
    const compSet = new Set(comp);

    // Row height step: max node height in component + gap
    let maxH = DEF_H;
    for (const idx of comp) maxH = Math.max(maxH, getH(idx));
    const rowStep = maxH + GAP;

    // Min level in component (for y offset; typically 0)
    let minLv = Infinity;
    for (const idx of comp) {
      const lv = levelMemo.get(idx)!;
      if (lv < minLv) minLv = lv;
    }

    // Direct layout children: nxt nodes at exactly level+1 within this component,
    // sorted by tree rank.
    const getDirectChildren = (idx: number): number[] =>
      Array.from(idx2chain.get(idx)?.nxt ?? [])
        .filter(
          (n) =>
            compSet.has(n) && levelMemo.get(n) === levelMemo.get(idx)! + 1,
        )
        .sort((a, b) => (treeRank.get(a) ?? 0) - (treeRank.get(b) ?? 0));

    // Primary parent: the first node in tree order that claims each child.
    // A node's subtree is "owned" by its primary parent.
    const primaryParent = new Map<number, number>();
    for (const idx of treeOrder) {
      if (!compSet.has(idx)) continue;
      for (const child of getDirectChildren(idx)) {
        if (!primaryParent.has(child)) primaryParent.set(child, idx);
      }
    }

    // Primary children: direct children whose primary parent is this node.
    const getPrimaryChildren = (idx: number): number[] =>
      getDirectChildren(idx).filter((c) => primaryParent.get(c) === idx);

    // Subtree width (bottom-up):
    //   leaf  → nodeWidth
    //   inner → max(nodeWidth, sum(childSubtreeWidths) + GAP*(n-1))
    const subtreeW = new Map<number, number>();
    const getSubtreeW = (idx: number): number => {
      if (subtreeW.has(idx)) return subtreeW.get(idx)!;
      const children = getPrimaryChildren(idx);
      let w: number;
      if (children.length === 0) {
        w = getW(idx);
      } else {
        const childrenTotal = children.reduce(
          (sum, c) => sum + getSubtreeW(c),
          0,
        );
        w = Math.max(getW(idx), childrenTotal + GAP * (children.length - 1));
      }
      subtreeW.set(idx, w);
      return w;
    };
    for (const idx of comp) getSubtreeW(idx);

    // Root nodes: those at minLv (no prerequisites within component)
    const roots = comp
      .filter((idx) => levelMemo.get(idx) === minLv)
      .sort((a, b) => (treeRank.get(a) ?? 0) - (treeRank.get(b) ?? 0));

    const totalRootsW =
      roots.reduce((sum, r) => sum + getSubtreeW(r), 0) +
      GAP * (roots.length - 1);

    // Place subtree top-down: node centered at centerX, children spread beneath.
    const placeSubtree = (idx: number, centerX: number) => {
      if (result.has(idx)) return; // shared DAG node already placed
      result.set(idx, {
        x: Math.round(centerX),
        y: Math.round((levelMemo.get(idx)! - minLv) * rowStep),
      });
      const children = getPrimaryChildren(idx);
      if (children.length === 0) return;
      const childrenTotalW =
        children.reduce((sum, c) => sum + getSubtreeW(c), 0) +
        GAP * (children.length - 1);
      let childLeft = centerX - childrenTotalW / 2;
      for (const child of children) {
        const cw = getSubtreeW(child);
        placeSubtree(child, childLeft + cw / 2);
        childLeft += cw + GAP;
      }
    };

    let rootLeft = clusterOffsetX;
    for (const root of roots) {
      const rw = getSubtreeW(root);
      placeSubtree(root, rootLeft + rw / 2);
      rootLeft += rw + GAP;
    }

    clusterOffsetX += totalRootsW + GAP;
  }

  return result;
};
