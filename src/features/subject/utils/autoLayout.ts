import { LAYOUT_COL_GAP, LAYOUT_PART_GAP, LAYOUT_ROW_GAP } from "../constants";
import type { ChainMap } from "../types/Chain/chainOp";
import type { SbjMap } from "../types/Curriculum/curriculumOp";

const EPS_MEDIAN = 1e-6;

type BlockLayout = {
  nodeIds: number[];
  minLevel: number;
  levels: number[];
  levelLeft: Map<number, number>;
  levelRight: Map<number, number>;
  bboxLeft: number;
  bboxRight: number;
  bboxTop: number;
  bboxBottom: number;
};

type LayoutItem = {
  id: number;
  kind: "node" | "block";
  levels: number[];
  levelLeft: Map<number, number>;
  levelRight: Map<number, number>;
  getCenterX: () => number;
  getIdealX: () => number | undefined;
  setCenterX: (x: number) => void;
  shiftX: (dx: number) => void;
};

const computeAutoLayout = (
  idx2chain: ChainMap,
  idx2sbj: SbjMap,
  sizes?: Map<number, { w: number; h: number }>,
): Map<number, { x: number; y: number }> => {
  const result = new Map<number, { x: number; y: number }>();

  const nodeIds = [...idx2sbj.keys()].sort((a, b) => a - b);

  const getSize = (idx: number) => sizes?.get(idx) ?? { w: 120, h: 48 };

  const leftOf = (idx: number) => result.get(idx)!.x - getSize(idx).w / 2;
  const rightOf = (idx: number) => result.get(idx)!.x + getSize(idx).w / 2;
  const topOf = (idx: number) => result.get(idx)!.y - getSize(idx).h / 2;
  const bottomOf = (idx: number) => result.get(idx)!.y + getSize(idx).h / 2;

  const shiftNodesX = (ids: number[], dx: number): void => {
    if (Math.abs(dx) <= EPS_MEDIAN) return;
    for (const idx of ids) {
      const p = result.get(idx)!;
      result.set(idx, { x: p.x + dx, y: p.y });
    }
  };

  const shiftNodesY = (ids: number[], dy: number): void => {
    if (Math.abs(dy) <= EPS_MEDIAN) return;
    for (const idx of ids) {
      const p = result.get(idx)!;
      result.set(idx, { x: p.x, y: p.y + dy });
    }
  };

  const median = (xs: number[]): number => {
    if (xs.length === 0) return 0;
    const sorted = [...xs].sort((a, b) => a - b);
    const m = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[m]
      : (sorted[m - 1] + sorted[m]) / 2;
  };

  const centerOfBbox = (ids: number[]): { x: number; y: number } => {
    let l = Infinity,
      r = -Infinity,
      t = Infinity,
      b = -Infinity;
    for (const idx of ids) {
      l = Math.min(l, leftOf(idx));
      r = Math.max(r, rightOf(idx));
      t = Math.min(t, topOf(idx));
      b = Math.max(b, bottomOf(idx));
    }
    if (!ids.length) return { x: 0, y: 0 };
    return { x: (l + r) / 2, y: (t + b) / 2 };
  };

  const connectedComponentsUndirected = (ids: number[]): number[][] => {
    const idSet = new Set(ids);
    const adj = new Map<number, Set<number>>();
    for (const idx of idSet) adj.set(idx, new Set<number>());
    for (const idx of idSet) {
      for (const j of idx2chain.get(idx)?.nxt ?? []) {
        if (!idSet.has(j)) continue;
        adj.get(idx)!.add(j);
        adj.get(j)!.add(idx);
      }
    }
    const visited = new Set<number>();
    const comps: number[][] = [];
    for (const start of ids) {
      if (visited.has(start)) continue;
      const comp: number[] = [];
      const stack = [start];
      visited.add(start);
      while (stack.length) {
        const cur = stack.pop()!;
        comp.push(cur);
        for (const nb of adj.get(cur)!) {
          if (visited.has(nb)) continue;
          visited.add(nb);
          stack.push(nb);
        }
      }
      comps.push(comp);
    }
    return comps;
  };

  const partitionIds = connectedComponentsUndirected(nodeIds);

  const idx2part = new Map<number, number>();
  partitionIds.forEach((ids, partId) => {
    for (const idx of ids) idx2part.set(idx, partId);
  });

  const computeLevelsForPartition = (ids: number[]): Map<number, number> => {
    const idSet = new Set(ids);

    const indeg = new Map<number, number>();
    const outAdj = new Map<number, number[]>();
    const inAdj = new Map<number, number[]>();

    for (const idx of ids) {
      indeg.set(idx, 0);
      outAdj.set(idx, []);
      inAdj.set(idx, []);
    }

    for (const idx of ids) {
      for (const j of idx2chain.get(idx)?.nxt ?? []) {
        if (!idSet.has(j)) continue;
        outAdj.get(idx)!.push(j);
        inAdj.get(j)!.push(idx);
        indeg.set(j, (indeg.get(j) ?? 0) + 1);
      }
    }

    // Topological order
    const q: number[] = [];
    for (const idx of ids) {
      if ((indeg.get(idx) ?? 0) === 0) q.push(idx);
    }
    q.sort((a, b) => a - b);

    const topo: number[] = [];
    while (q.length) {
      const cur = q.shift()!;
      topo.push(cur);

      for (const j of outAdj.get(cur) ?? []) {
        indeg.set(j, (indeg.get(j) ?? 1) - 1);
        if ((indeg.get(j) ?? 0) === 0) q.push(j);
      }

      q.sort((a, b) => a - b);
    }

    // 1) Base forward compact layering
    const lvl = new Map<number, number>();
    for (const idx of ids) lvl.set(idx, 0);

    const propagateForward = (): boolean => {
      let changed = false;

      for (const cur of topo) {
        const curL = lvl.get(cur) ?? 0;
        for (const j of outAdj.get(cur) ?? []) {
          const need = curL + 1;
          if ((lvl.get(j) ?? 0) < need) {
            lvl.set(j, need);
            changed = true;
          }
        }
      }

      return changed;
    };

    propagateForward();

    // Pull backward only through maximal linear upstream chain:
    // child has exactly one parent, parent has exactly one child.
    const tightenLinearUpstream = (startChild: number): boolean => {
      let changed = false;
      let child = startChild;

      while (true) {
        const parents = inAdj.get(child) ?? [];
        if (parents.length !== 1) break;

        const parent = parents[0];
        const parentChildren = outAdj.get(parent) ?? [];
        if (parentChildren.length !== 1) break;

        const target = (lvl.get(child) ?? 0) - 1;
        if ((lvl.get(parent) ?? 0) >= target) break;

        lvl.set(parent, target);
        changed = true;
        child = parent;
      }

      return changed;
    };

    // 2) Merge alignment + 3) linear upstream tightening + 4) forward re-propagation
    let changed = true;
    while (changed) {
      changed = false;

      for (const m of topo) {
        const parents = inAdj.get(m) ?? [];
        if (parents.length < 2) continue;

        const target = (lvl.get(m) ?? 0) - 1;

        for (const p of parents) {
          if ((lvl.get(p) ?? 0) < target) {
            lvl.set(p, target);
            changed = true;
          }

          if (tightenLinearUpstream(p)) {
            changed = true;
          }
        }
      }

      if (propagateForward()) {
        changed = true;
      }
    }

    // Normalize so min(level) = 0
    let minL = Infinity;
    for (const idx of ids) {
      minL = Math.min(minL, lvl.get(idx) ?? 0);
    }

    for (const idx of ids) {
      lvl.set(idx, (lvl.get(idx) ?? 0) - minL);
    }

    return lvl;
  };
  const idx2level = new Map<number, number>();
  partitionIds.forEach((ids) => {
    const partLevels = computeLevelsForPartition(ids);
    for (const [idx, lv] of partLevels) idx2level.set(idx, lv);
  });

  for (const idx of nodeIds) {
    const sbj = idx2sbj.get(idx);
    result.set(
      idx,
      sbj?.sbjType === "SUBJECT" ? { x: sbj.x, y: sbj.y } : { x: 0, y: 0 },
    );
  }

  const rowIdsByPartition = new Map<number, Map<number, number[]>>();
  for (const idx of nodeIds) {
    const partId = idx2part.get(idx) ?? -1;
    const level = idx2level.get(idx) ?? 0;
    if (!rowIdsByPartition.has(partId))
      rowIdsByPartition.set(partId, new Map());
    const rowMap = rowIdsByPartition.get(partId)!;
    if (!rowMap.has(level)) rowMap.set(level, []);
    rowMap.get(level)!.push(idx);
  }

  const assignInitialYForPartition = (partId: number): void => {
    const rowMap = rowIdsByPartition.get(partId)!;
    const levels = [...rowMap.keys()].sort((a, b) => a - b);
    const rowHeight = new Map<number, number>();
    for (const lv of levels) {
      let h = 0;
      for (const idx of rowMap.get(lv) ?? []) h = Math.max(h, getSize(idx).h);
      rowHeight.set(lv, h);
    }

    const rowY = new Map<number, number>();
    if (levels.length) rowY.set(levels[0], 0);
    for (let i = 1; i < levels.length; i++) {
      const prev = levels[i - 1];
      const cur = levels[i];
      const y =
        (rowY.get(prev) ?? 0) +
        (rowHeight.get(prev) ?? 0) / 2 +
        LAYOUT_ROW_GAP +
        (rowHeight.get(cur) ?? 0) / 2;
      rowY.set(cur, y);
    }

    for (const lv of levels) {
      const y = rowY.get(lv) ?? 0;
      for (const idx of rowMap.get(lv) ?? []) {
        const p = result.get(idx)!;
        result.set(idx, { x: p.x, y });
      }
    }
  };

  for (let partId = 0; partId < partitionIds.length; partId++) {
    assignInitialYForPartition(partId);
  }

  const buildBlockLayout = (ids: number[]): BlockLayout => {
    const levelLeft = new Map<number, number>();
    const levelRight = new Map<number, number>();
    const levelSet = new Set<number>();
    let bboxLeft = Infinity;
    let bboxRight = -Infinity;
    let bboxTop = Infinity;
    let bboxBottom = -Infinity;
    let minLevel = Infinity;

    for (const idx of ids) {
      const lv = idx2level.get(idx) ?? 0;
      levelSet.add(lv);
      minLevel = Math.min(minLevel, lv);
      const l = leftOf(idx);
      const r = rightOf(idx);
      levelLeft.set(lv, Math.min(levelLeft.get(lv) ?? Infinity, l));
      levelRight.set(lv, Math.max(levelRight.get(lv) ?? -Infinity, r));
      bboxLeft = Math.min(bboxLeft, l);
      bboxRight = Math.max(bboxRight, r);
      bboxTop = Math.min(bboxTop, topOf(idx));
      bboxBottom = Math.max(bboxBottom, bottomOf(idx));
    }

    const levels = [...levelSet].sort((a, b) => a - b);
    return {
      nodeIds: [...ids],
      minLevel,
      levels,
      levelLeft,
      levelRight,
      bboxLeft,
      bboxRight,
      bboxTop,
      bboxBottom,
    };
  };

  const makeNodeItem = (idx: number): LayoutItem => {
    const lv = idx2level.get(idx) ?? 0;
    return {
      id: idx,
      kind: "node",
      levels: [lv],
      levelLeft: new Map([[lv, leftOf(idx)]]),
      levelRight: new Map([[lv, rightOf(idx)]]),
      getCenterX: () => result.get(idx)!.x,
      getIdealX: () => undefined,
      setCenterX: (x: number) => {
        const p = result.get(idx)!;
        result.set(idx, { x, y: p.y });
      },
      shiftX: (dx: number) => shiftNodesX([idx], dx),
    };
  };

  const makeBlockItem = (layout: BlockLayout, id: number): LayoutItem => {
    const refresh = (): BlockLayout => buildBlockLayout(layout.nodeIds);
    return {
      id,
      kind: "block",
      levels: [...layout.levels],
      levelLeft: new Map(layout.levelLeft),
      levelRight: new Map(layout.levelRight),
      getCenterX: () => centerOfBbox(layout.nodeIds).x,
      getIdealX: () => centerOfBbox(layout.nodeIds).x,
      setCenterX: (x: number) => {
        const cur = centerOfBbox(layout.nodeIds).x;
        shiftNodesX(layout.nodeIds, x - cur);
        const next = refresh();
        layout.levels = next.levels;
        layout.levelLeft = next.levelLeft;
        layout.levelRight = next.levelRight;
      },
      shiftX: (dx: number) => {
        shiftNodesX(layout.nodeIds, dx);
        const next = refresh();
        layout.levels = next.levels;
        layout.levelLeft = next.levelLeft;
        layout.levelRight = next.levelRight;
      },
    };
  };

  const refreshItemBounds = (item: LayoutItem): void => {
    if (item.kind === "node") {
      const lv = item.levels[0];
      item.levelLeft.set(lv, leftOf(item.id));
      item.levelRight.set(lv, rightOf(item.id));
      return;
    }
    const allIds = blockId2layout.get(item.id)?.nodeIds ?? [];
    const fresh = buildBlockLayout(allIds);
    item.levels = fresh.levels;
    item.levelLeft = fresh.levelLeft;
    item.levelRight = fresh.levelRight;
  };

  const requiredShift = (a: LayoutItem, b: LayoutItem): number => {
    refreshItemBounds(a);
    refreshItemBounds(b);
    const common = a.levels.filter((lv) => b.levels.includes(lv));
    if (common.length === 0) return 0;
    let req = 0;
    for (const lv of common) {
      const v =
        (a.levelRight.get(lv) ?? -Infinity) +
        LAYOUT_COL_GAP -
        (b.levelLeft.get(lv) ?? Infinity);
      req = Math.max(req, v);
    }
    return Math.max(0, req);
  };

  const assignTemporaryIdeals = (
    orderedItems: LayoutItem[],
    idealMap: Map<number, number | undefined>,
  ): Map<number, number> => {
    const temp = new Map<number, number>();
    const base = orderedItems.map((it) => idealMap.get(it.id));

    const getCompactCentersRight = (
      anchorX: number,
      items: LayoutItem[],
    ): number[] => {
      const centers: number[] = [];
      for (let i = 0; i < items.length; i++) {
        if (i === 0) {
          centers.push(anchorX);
          continue;
        }
        items[i].setCenterX(anchorX);
        items[i - 1].setCenterX(centers[i - 1]);
        const req = requiredShift(items[i - 1], items[i]);
        centers.push(centers[i - 1] + req);
      }
      return centers;
    };

    let i = 0;
    while (i < orderedItems.length) {
      if (base[i] !== undefined) {
        temp.set(orderedItems[i].id, base[i]!);
        i++;
        continue;
      }
      let j = i;
      while (j < orderedItems.length && base[j] === undefined) j++;

      const leftHas = i - 1 >= 0 && base[i - 1] !== undefined;
      const rightHas = j < orderedItems.length && base[j] !== undefined;
      const len = j - i;

      if (leftHas && rightHas) {
        const leftIdeal = base[i - 1]!;
        const rightIdeal = base[j]!;
        for (let k = 0; k < len; k++) {
          temp.set(
            orderedItems[i + k].id,
            leftIdeal + ((rightIdeal - leftIdeal) * (k + 1)) / (len + 1),
          );
        }
      } else if (leftHas && !rightHas) {
        const anchorX = base[i - 1]!;
        const chunk = orderedItems.slice(i - 1, j);
        const centers = getCompactCentersRight(anchorX, chunk);
        for (let k = 1; k < centers.length; k++) {
          temp.set(chunk[k].id, centers[k]);
        }
      } else if (!leftHas && rightHas) {
        const anchorX = base[j]!;
        orderedItems[j].setCenterX(anchorX);
        refreshItemBounds(orderedItems[j]);
        let rightItem = orderedItems[j];
        let rightX = anchorX;
        for (let k = j - 1; k >= i; k--) {
          const it = orderedItems[k];
          it.setCenterX(rightX);
          refreshItemBounds(it);
          const req = requiredShift(it, rightItem);
          const itX = rightX - req;
          temp.set(it.id, itX);
          it.setCenterX(itX);
          refreshItemBounds(it);
          rightX = itX;
          rightItem = it;
        }
      } else {
        const chunk = orderedItems.slice(i, j);
        for (const it of chunk) temp.set(it.id, it.getCenterX());
      }
      i = j;
    }

    return temp;
  };

  const bilateralSweep = (
    orderedItems: LayoutItem[],
    idealMapInput: Map<number, number | undefined>,
  ): void => {
    if (orderedItems.length === 0) return;

    const hadAnyRealIdeal = [...idealMapInput.values()].some(
      (v) => v !== undefined,
    );
    const tempIdeal = assignTemporaryIdeals(orderedItems, idealMapInput);

    for (const item of orderedItems) {
      const ix = tempIdeal.get(item.id);
      if (ix !== undefined) item.setCenterX(ix);
      refreshItemBounds(item);
    }

    let idealLeft = Infinity;
    let idealRight = -Infinity;
    for (const item of orderedItems) {
      const cx = tempIdeal.get(item.id)!;
      refreshItemBounds(item);
      const curCx = item.getCenterX();
      const dx = cx - curCx;
      for (const lv of item.levels) {
        idealLeft = Math.min(
          idealLeft,
          (item.levelLeft.get(lv) ?? Infinity) + dx,
        );
        idealRight = Math.max(
          idealRight,
          (item.levelRight.get(lv) ?? -Infinity) + dx,
        );
      }
    }
    const anchor = (idealLeft + idealRight) / 2;

    let split = -1;
    for (let i = 0; i < orderedItems.length; i++) {
      if ((tempIdeal.get(orderedItems[i].id) ?? 0) <= anchor) split = i;
    }

    const leftChain = orderedItems.slice(0, split + 1);
    const rightChain = orderedItems.slice(split + 1);

    if (leftChain.length) {
      const last = leftChain[leftChain.length - 1];
      last.setCenterX(tempIdeal.get(last.id)!);
      refreshItemBounds(last);
      for (let i = leftChain.length - 2; i >= 0; i--) {
        const cur = leftChain[i];
        const rightNeighbor = leftChain[i + 1];
        cur.setCenterX(tempIdeal.get(cur.id)!);
        refreshItemBounds(cur);
        const req = requiredShift(cur, rightNeighbor);
        const maxCenter = tempIdeal.get(cur.id)! - req;
        cur.setCenterX(Math.min(tempIdeal.get(cur.id)!, maxCenter));
        refreshItemBounds(cur);
      }
    }

    if (rightChain.length) {
      const first = rightChain[0];
      first.setCenterX(tempIdeal.get(first.id)!);
      refreshItemBounds(first);
      for (let i = 1; i < rightChain.length; i++) {
        const cur = rightChain[i];
        const leftNeighbor = rightChain[i - 1];
        cur.setCenterX(tempIdeal.get(cur.id)!);
        refreshItemBounds(cur);
        const req = requiredShift(leftNeighbor, cur);
        const minCenter = tempIdeal.get(cur.id)! + req;
        cur.setCenterX(Math.max(tempIdeal.get(cur.id)!, minCenter));
        refreshItemBounds(cur);
      }
    }

    if (!hadAnyRealIdeal) {
      let l = Infinity;
      let r = -Infinity;
      for (const item of orderedItems) {
        refreshItemBounds(item);
        for (const lv of item.levels) {
          l = Math.min(l, item.levelLeft.get(lv) ?? Infinity);
          r = Math.max(r, item.levelRight.get(lv) ?? -Infinity);
        }
      }
      const center = (l + r) / 2;
      for (const item of orderedItems) item.shiftX(-center);
      return;
    }

    let actualLeft = Infinity;
    let actualRight = -Infinity;
    for (const item of orderedItems) {
      refreshItemBounds(item);
      for (const lv of item.levels) {
        actualLeft = Math.min(actualLeft, item.levelLeft.get(lv) ?? Infinity);
        actualRight = Math.max(
          actualRight,
          item.levelRight.get(lv) ?? -Infinity,
        );
      }
    }
    const currentCenter = (actualLeft + actualRight) / 2;
    const shift = anchor - currentCenter;
    for (const item of orderedItems) item.shiftX(shift);
  };

  const parentMedian = (idx: number): number => {
    const nxt = idx2chain.get(idx)?.nxt;
    const xs: number[] = [];
    for (const j of nxt ?? []) {
      if (!result.has(j)) continue;
      xs.push(result.get(j)!.x);
    }
    return xs.length ? median(xs) : NaN;
  };

  const childMedian = (layout: BlockLayout): number => {
    const topLevel = layout.minLevel;
    const xs: number[] = [];
    for (const idx of layout.nodeIds) {
      if ((idx2level.get(idx) ?? 0) === topLevel) xs.push(result.get(idx)!.x);
    }
    return xs.length ? median(xs) : centerOfBbox(layout.nodeIds).x;
  };

  const kinship = (a: number, b: number): number => {
    const an = idx2chain.get(a)?.nxt;
    const bn = idx2chain.get(b)?.nxt;
    let cnt = 0;
    for (const x of an ?? []) if (bn?.has(x)) cnt++;
    return cnt;
  };

  const blockId2layout = new Map<number, BlockLayout>();
  let nextBlockId = 1_000_000_000;

  const orderChildren = (children: BlockLayout[]): BlockLayout[] => {
    return [...children].sort((a, b) => {
      const ma = childMedian(a);
      const mb = childMedian(b);
      if (Math.abs(ma - mb) > EPS_MEDIAN) return ma - mb;
      const xa = centerOfBbox(a.nodeIds).x;
      const xb = centerOfBbox(b.nodeIds).x;
      if (Math.abs(xa - xb) > EPS_MEDIAN) return xa - xb;
      const ia = Math.min(...a.nodeIds);
      const ib = Math.min(...b.nodeIds);
      return ia - ib;
    });
  };

  const compactPlaceChildren = (children: BlockLayout[]): void => {
    if (children.length === 0) return;
    const items = children.map((child) => {
      const id = nextBlockId++;
      blockId2layout.set(id, child);
      return makeBlockItem(child, id);
    });

    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1];
      const cur = items[i];
      const dx = requiredShift(prev, cur);
      cur.shiftX(dx);
    }
  };

  const orderParentNodes = (ids: number[]): number[] => {
    const ordered = [...ids].sort((a, b) => {
      const ma = parentMedian(a);
      const mb = parentMedian(b);
      const aHas = !Number.isNaN(ma);
      const bHas = !Number.isNaN(mb);
      if (aHas && bHas && Math.abs(ma - mb) > EPS_MEDIAN) return ma - mb;
      if (aHas !== bHas) return aHas ? -1 : 1;

      const xa = result.get(a)!.x;
      const xb = result.get(b)!.x;
      if (Math.abs(xa - xb) > EPS_MEDIAN) return xa - xb;
      return a - b;
    });

    // Kinship heuristic: one-pass adjacent local swap within same median group.
    let i = 0;
    while (i < ordered.length) {
      const m = parentMedian(ordered[i]);
      let j = i + 1;
      while (
        j < ordered.length &&
        ((Number.isNaN(m) && Number.isNaN(parentMedian(ordered[j]))) ||
          Math.abs(parentMedian(ordered[j]) - m) <= EPS_MEDIAN)
      ) {
        j++;
      }
      for (let k = i; k + 2 < j; k++) {
        const a = ordered[k];
        const b = ordered[k + 1];
        const c = ordered[k + 2];
        if (kinship(a, c) > kinship(a, b)) {
          ordered[k + 1] = c;
          ordered[k + 2] = b;
        }
      }
      i = j;
    }

    return ordered;
  };

  const layoutBlock = (blockNodeIds: number[]): BlockLayout => {
    if (blockNodeIds.length === 0) {
      return {
        nodeIds: [],
        minLevel: 0,
        levels: [],
        levelLeft: new Map(),
        levelRight: new Map(),
        bboxLeft: 0,
        bboxRight: 0,
        bboxTop: 0,
        bboxBottom: 0,
      };
    }

    const blockSet = new Set(blockNodeIds);
    let minLevel = Infinity;
    for (const idx of blockNodeIds)
      minLevel = Math.min(minLevel, idx2level.get(idx) ?? 0);

    const parentNodes = blockNodeIds.filter(
      (idx) => (idx2level.get(idx) ?? 0) === minLevel,
    );
    const rest = blockNodeIds.filter((idx) => !parentNodes.includes(idx));

    const childrenComps = connectedComponentsUndirected(rest);
    const childLayouts = childrenComps.map((comp) => layoutBlock(comp));

    const orderedChildren = orderChildren(childLayouts);
    compactPlaceChildren(orderedChildren);

    const orderedParent = orderParentNodes(parentNodes);
    const items = orderedParent.map((idx) => makeNodeItem(idx));

    const idealMap = new Map<number, number | undefined>();
    for (const idx of orderedParent) {
      const nxt = idx2chain.get(idx)?.nxt;
      const xs: number[] = [];
      let minL = Infinity;
      let maxR = -Infinity;
      for (const j of nxt ?? []) {
        if (!blockSet.has(j)) continue;
        xs.push(result.get(j)!.x);
        minL = Math.min(minL, leftOf(j));
        maxR = Math.max(maxR, rightOf(j));
      }
      idealMap.set(idx, xs.length === 0 ? undefined : (minL + maxR) / 2);
    }

    bilateralSweep(items, idealMap);
    return buildBlockLayout(blockNodeIds);
  };

  const partitionLayouts: BlockLayout[] = [];
  for (let partId = 0; partId < partitionIds.length; partId++) {
    partitionLayouts.push(layoutBlock(partitionIds[partId]));
  }

  // Place partitions left-to-right.
  const orderedPartitions = [...partitionLayouts].sort((a, b) => {
    const xa = centerOfBbox(a.nodeIds).x;
    const xb = centerOfBbox(b.nodeIds).x;
    if (Math.abs(xa - xb) > EPS_MEDIAN) return xa - xb;

    const aLv0 = a.nodeIds
      .filter((idx) => (idx2level.get(idx) ?? 0) === 0)
      .sort((a, b) => a - b);
    const bLv0 = b.nodeIds
      .filter((idx) => (idx2level.get(idx) ?? 0) === 0)
      .sort((a, b) => a - b);
    return (aLv0[0] ?? Infinity) - (bLv0[0] ?? Infinity);
  });

  for (let i = 1; i < orderedPartitions.length; i++) {
    const prev = buildBlockLayout(orderedPartitions[i - 1].nodeIds);
    const cur = buildBlockLayout(orderedPartitions[i].nodeIds);
    const prevItem = makeBlockItem(prev, nextBlockId++);
    blockId2layout.set(prevItem.id, prev);
    const curItem = makeBlockItem(cur, nextBlockId++);
    blockId2layout.set(curItem.id, cur);

    const common = prevItem.levels.filter((lv) => curItem.levels.includes(lv));
    let req = 0;
    if (common.length === 0) {
      req = prev.bboxRight + LAYOUT_PART_GAP - cur.bboxLeft;
    } else {
      for (const lv of common) {
        req = Math.max(
          req,
          (prevItem.levelRight.get(lv) ?? -Infinity) +
            LAYOUT_PART_GAP -
            (curItem.levelLeft.get(lv) ?? Infinity),
        );
      }
    }
    curItem.shiftX(Math.max(0, req));
  }

  // Align all level-0 rows vertically.
  const level0Ys: number[] = [];
  for (const ids of partitionIds) {
    const lv0 = ids.filter((idx) => (idx2level.get(idx) ?? 0) === 0);
    if (lv0.length) level0Ys.push(result.get(lv0[0])!.y);
  }
  const targetLevel0Y = level0Ys.length ? median(level0Ys) : 0;
  for (const ids of partitionIds) {
    const lv0 = ids.filter((idx) => (idx2level.get(idx) ?? 0) === 0);
    if (!lv0.length) continue;
    const dy = targetLevel0Y - result.get(lv0[0])!.y;
    shiftNodesY(ids, dy);
  }

  // Final normalize to center (0, 0).
  if (nodeIds.length) {
    let l = Infinity,
      r = -Infinity,
      t = Infinity,
      b = -Infinity;
    for (const idx of nodeIds) {
      l = Math.min(l, leftOf(idx));
      r = Math.max(r, rightOf(idx));
      t = Math.min(t, topOf(idx));
      b = Math.max(b, bottomOf(idx));
    }
    shiftNodesX(nodeIds, -(l + r) / 2);
    shiftNodesY(nodeIds, -(t + b) / 2);
  }

  return result;
};

export { computeAutoLayout };
