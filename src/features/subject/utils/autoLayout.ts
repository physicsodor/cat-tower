import {
  buildChainLevelMap,
  getPartition,
  type ChainMap,
} from "../types/Chain/chainOp";
import type { SbjMap } from "../types/Curriculum/curriculumOp";
import {
  LAYOUT_COL_GAP,
  LAYOUT_ROW_GAP,
  LAYOUT_PARTITION_GAP,
  LAYOUT_DEFAULT_W,
  LAYOUT_DEFAULT_H,
} from "../constants";

interface Cluster {
  level: number;
  rootIdxs: number[];
  childClusters: Cluster[];
  left: number;
  right: number;
  // per-level bounds used for level-aware compact packing
  levelBounds: Map<number, { left: number; right: number }>;
}

const computeAutoLayout = (
  idx2chain: ChainMap,
  idx2sbj: SbjMap,
  sizes?: Map<number, { w: number; h: number }>,
): Map<number, { x: number; y: number }> => {
  const result = new Map<number, { x: number; y: number }>();

  const subjectIdxs: number[] = [];
  for (const [idx, info] of idx2sbj)
    if (info.sbjType === "SUBJECT" && idx2chain.has(idx))
      subjectIdxs.push(idx);
  if (subjectIdxs.length === 0) return result;

  const getSize = (idx: number) =>
    sizes?.get(idx) ?? { w: LAYOUT_DEFAULT_W, h: LAYOUT_DEFAULT_H };

  const partition = getPartition(idx2chain);
  const idx2level = buildChainLevelMap(idx2chain, partition);

  // x positions: initialized from current layout, adjusted in-place
  const xPos = new Map<number, number>();
  for (const idx of subjectIdxs) {
    const s = idx2sbj.get(idx);
    xPos.set(idx, s?.sbjType === "SUBJECT" ? s.x : 0);
  }

  // ── Partition helpers ────────────────────────────────────────────────────

  // Group same-level nodes: A and B are in the same group if they share any
  // transitive descendant within scope (union-find on nxtSet intersection).
  const groupBySharedDesc = (
    nodes: number[],
    scope: Set<number>,
  ): number[][] => {
    const par = new Map<number, number>(nodes.map(n => [n, n]));
    const find = (x: number): number => {
      if (par.get(x) !== x) par.set(x, find(par.get(x)!));
      return par.get(x)!;
    };
    const union = (a: number, b: number) => par.set(find(a), find(b));

    for (let i = 0; i < nodes.length; i++) {
      const aNxt = idx2chain.get(nodes[i])?.nxtSet;
      if (!aNxt) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        const bNxt = idx2chain.get(nodes[j])?.nxtSet;
        if (!bNxt) continue;
        for (const n of aNxt) {
          if (scope.has(n) && bNxt.has(n)) {
            union(nodes[i], nodes[j]);
            break;
          }
        }
      }
    }

    const groups = new Map<number, number[]>();
    for (const n of nodes) {
      const r = find(n);
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r)!.push(n);
    }
    return [...groups.values()];
  };

  // Recursively build the hierarchical cluster tree.
  // nodeSet: all nodes belonging to this sub-tree (levels >= `level`).
  const buildClusters = (nodeSet: Set<number>, level: number): Cluster[] => {
    const roots = [...nodeSet]
      .filter(n => idx2level.get(n) === level)
      .sort((a, b) => (xPos.get(a) ?? 0) - (xPos.get(b) ?? 0));
    if (roots.length === 0) return [];

    const groups = groupBySharedDesc(roots, nodeSet);
    groups.sort((ga, gb) => {
      const ma = ga.reduce((s, n) => s + (xPos.get(n) ?? 0), 0) / ga.length;
      const mb = gb.reduce((s, n) => s + (xPos.get(n) ?? 0), 0) / gb.length;
      return ma - mb;
    });

    return groups.map(rootIdxs => {
      const childSet = new Set<number>();
      for (const r of rootIdxs)
        for (const d of idx2chain.get(r)?.nxtSet ?? [])
          if (nodeSet.has(d)) childSet.add(d);
      return {
        level,
        rootIdxs,
        childClusters: buildClusters(childSet, level + 1),
        left: 0,
        right: 0,
        levelBounds: new Map(),
      };
    });
  };

  // Build one set of clusters per connected component, then merge.
  const topClusters: Cluster[] = [];
  for (const comp of partition) {
    const compSet = new Set(
      comp.filter(idx => idx2sbj.get(idx)?.sbjType === "SUBJECT"),
    );
    if (compSet.size === 0) continue;
    topClusters.push(...buildClusters(compSet, 0));
  }
  topClusters.sort((ca, cb) => {
    const ma =
      ca.rootIdxs.reduce((s, n) => s + (xPos.get(n) ?? 0), 0) /
      ca.rootIdxs.length;
    const mb =
      cb.rootIdxs.reduce((s, n) => s + (xPos.get(n) ?? 0), 0) /
      cb.rootIdxs.length;
    return ma - mb;
  });

  // ── x assignment ─────────────────────────────────────────────────────────

  const shiftCluster = (c: Cluster, delta: number): void => {
    if (delta === 0) return;
    for (const r of c.rootIdxs) xPos.set(r, (xPos.get(r) ?? 0) + delta);
    for (const ch of c.childClusters) shiftCluster(ch, delta);
    c.left += delta;
    c.right += delta;
    for (const b of c.levelBounds.values()) {
      b.left += delta;
      b.right += delta;
    }
  };

  const recomputeEnv = (c: Cluster): void => {
    c.levelBounds.clear();
    const mergeLv = (lv: number, l: number, r: number) => {
      const b = c.levelBounds.get(lv);
      if (!b) c.levelBounds.set(lv, { left: l, right: r });
      else { b.left = Math.min(b.left, l); b.right = Math.max(b.right, r); }
    };
    const ls: number[] = [];
    const rs: number[] = [];
    for (const r of c.rootIdxs) {
      const { w } = getSize(r);
      const x = xPos.get(r) ?? 0;
      ls.push(x - w / 2);
      rs.push(x + w / 2);
      mergeLv(c.level, x - w / 2, x + w / 2);
    }
    for (const ch of c.childClusters) {
      ls.push(ch.left);
      rs.push(ch.right);
      for (const [lv, b] of ch.levelBounds) mergeLv(lv, b.left, b.right);
    }
    c.left = Math.min(...ls);
    c.right = Math.max(...rs);
  };

  const mergeLevelBounds = (
    acc: Map<number, { left: number; right: number }>,
    c: Cluster,
  ) => {
    for (const [lv, b] of c.levelBounds) {
      const ex = acc.get(lv);
      if (!ex) acc.set(lv, { left: b.left, right: b.right });
      else {
        ex.left = Math.min(ex.left, b.left);
        ex.right = Math.max(ex.right, b.right);
      }
    }
  };

  const assignX = (c: Cluster): void => {
    // ── Leaf cluster: place roots compactly (tight packing) ──
    if (c.childClusters.length === 0) {
      // rootIdxs already sorted by initial x; first root stays, rest are packed tightly
      for (let i = 1; i < c.rootIdxs.length; i++) {
        const prev = c.rootIdxs[i - 1];
        const curr = c.rootIdxs[i];
        xPos.set(
          curr,
          (xPos.get(prev) ?? 0) +
            getSize(prev).w / 2 +
            LAYOUT_COL_GAP +
            getSize(curr).w / 2,
        );
      }
      recomputeEnv(c);
      return;
    }

    // ── Non-leaf: recurse, pack children, then set root positions ──

    for (const ch of c.childClusters) assignX(ch);

    // Compact-pack child clusters: compare each cluster against the accumulated
    // level bounds of ALL previous siblings to avoid any same-level overlap.
    if (c.childClusters.length > 0) {
      const acc = new Map<number, { left: number; right: number }>();
      mergeLevelBounds(acc, c.childClusters[0]);
      for (let i = 1; i < c.childClusters.length; i++) {
        const curr = c.childClusters[i];
        let shift = -Infinity;
        for (const [lv, pb] of acc) {
          const cb = curr.levelBounds.get(lv);
          if (!cb) continue;
          shift = Math.max(shift, pb.right + LAYOUT_COL_GAP - cb.left);
        }
        if (shift !== -Infinity) shiftCluster(curr, shift);
        mergeLevelBounds(acc, curr);
      }
    }

    // Set each root's x = center of its direct nxt nodes' envelope
    for (const rootIdx of c.rootIdxs) {
      const nxt = [...(idx2chain.get(rootIdx)?.nxt ?? [])].filter(n =>
        xPos.has(n),
      );
      if (nxt.length === 0) continue;
      const nl = Math.min(...nxt.map(n => (xPos.get(n) ?? 0) - getSize(n).w / 2));
      const nr = Math.max(...nxt.map(n => (xPos.get(n) ?? 0) + getSize(n).w / 2));
      xPos.set(rootIdx, (nl + nr) / 2);
    }

    // Re-sort roots by updated x
    c.rootIdxs.sort((a, b) => (xPos.get(a) ?? 0) - (xPos.get(b) ?? 0));

    // Enforce COLUMN_GAP between root nodes (relatives).
    // Children are shared among relatives, so only the root node itself moves.
    for (let i = 1; i < c.rootIdxs.length; i++) {
      const prev = c.rootIdxs[i - 1];
      const curr = c.rootIdxs[i];
      const minX =
        (xPos.get(prev) ?? 0) +
        getSize(prev).w / 2 +
        LAYOUT_COL_GAP +
        getSize(curr).w / 2;
      if ((xPos.get(curr) ?? 0) < minX) xPos.set(curr, minX);
    }

    recomputeEnv(c);
  };

  for (const c of topClusters) assignX(c);

  // Space top-level clusters with PARTITION_GAP
  for (let i = 1; i < topClusters.length; i++) {
    const prev = topClusters[i - 1];
    const curr = topClusters[i];
    const minLeft = prev.right + LAYOUT_PARTITION_GAP;
    if (curr.left < minLeft) shiftCluster(curr, minLeft - curr.left);
  }

  // Center x at 0
  {
    const allL = Math.min(
      ...subjectIdxs.map(idx => (xPos.get(idx) ?? 0) - getSize(idx).w / 2),
    );
    const allR = Math.max(
      ...subjectIdxs.map(idx => (xPos.get(idx) ?? 0) + getSize(idx).w / 2),
    );
    const cx = (allL + allR) / 2;
    for (const idx of subjectIdxs) xPos.set(idx, (xPos.get(idx) ?? 0) - cx);
  }

  // ── y assignment ─────────────────────────────────────────────────────────

  const lv2nodes = new Map<number, number[]>();
  for (const idx of subjectIdxs) {
    const lv = idx2level.get(idx) ?? 0;
    if (!lv2nodes.has(lv)) lv2nodes.set(lv, []);
    lv2nodes.get(lv)!.push(idx);
  }
  const levels = [...lv2nodes.keys()].sort((a, b) => a - b);

  // y increases per level; center-to-center gap = prevH/2 + ROW_GAP + currH/2
  let curY = 0;
  const lv2y = new Map<number, number>([[levels[0], 0]]);
  for (let i = 1; i < levels.length; i++) {
    const prevMaxH = Math.max(
      ...(lv2nodes.get(levels[i - 1]) ?? []).map(idx => getSize(idx).h),
    );
    const currMaxH = Math.max(
      ...(lv2nodes.get(levels[i]) ?? []).map(idx => getSize(idx).h),
    );
    curY += prevMaxH / 2 + LAYOUT_ROW_GAP + currMaxH / 2;
    lv2y.set(levels[i], curY);
  }

  // Center y at 0
  {
    const allT = Math.min(
      ...subjectIdxs.map(
        idx => (lv2y.get(idx2level.get(idx) ?? 0) ?? 0) - getSize(idx).h / 2,
      ),
    );
    const allB = Math.max(
      ...subjectIdxs.map(
        idx => (lv2y.get(idx2level.get(idx) ?? 0) ?? 0) + getSize(idx).h / 2,
      ),
    );
    const cy = (allT + allB) / 2;
    for (const [lv, y] of lv2y) lv2y.set(lv, y - cy);
  }

  // ── Assemble result ───────────────────────────────────────────────────────

  for (const idx of subjectIdxs) {
    result.set(idx, {
      x: xPos.get(idx) ?? 0,
      y: lv2y.get(idx2level.get(idx) ?? 0) ?? 0,
    });
  }

  return result;
};

export { computeAutoLayout };
