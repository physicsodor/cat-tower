import { LAYOUT_COL_GAP, LAYOUT_PART_GAP, LAYOUT_ROW_GAP } from "../constants";
import type { ChainMap } from "@/lib/Chain/chain";
import { bboxFromXYWH, type BBox } from "../model/rect";

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

type LayoutCtx = {
  result: Map<number, BBox>;
  idx2chain: ChainMap;
  idx2level: Map<number, number>;
  blockId2layout: Map<number, BlockLayout>;
  nextBlockId: number;
};

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[m]
    : (sorted[m - 1] + sorted[m]) / 2;
};

const shiftNodesX = (
  result: Map<number, BBox>,
  ids: number[],
  dx: number,
): void => {
  if (Math.abs(dx) <= EPS_MEDIAN) return;
  for (const idx of ids) {
    const p = result.get(idx)!;
    result.set(idx, bboxFromXYWH(p.x + dx, p.y, p.w, p.h));
  }
};

const shiftNodesY = (
  result: Map<number, BBox>,
  ids: number[],
  dy: number,
): void => {
  if (Math.abs(dy) <= EPS_MEDIAN) return;
  for (const idx of ids) {
    const p = result.get(idx)!;
    result.set(idx, bboxFromXYWH(p.x, p.y + dy, p.w, p.h));
  }
};

const centerOfBbox = (
  result: Map<number, BBox>,
  ids: number[],
): { x: number; y: number } => {
  let l = Infinity,
    r = -Infinity,
    t = Infinity,
    b = -Infinity;
  for (const idx of ids) {
    const p = result.get(idx)!;
    l = Math.min(l, p.l);
    r = Math.max(r, p.r);
    t = Math.min(t, p.t);
    b = Math.max(b, p.b);
  }
  if (!ids.length) return { x: 0, y: 0 };
  return { x: (l + r) / 2, y: (t + b) / 2 };
};

const connectedComponentsUndirected = (
  idx2chain: ChainMap,
  ids: number[],
): number[][] => {
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

const computeLevelsForPartition = (
  idx2chain: ChainMap,
  ids: number[],
): Map<number, number> => {
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

  // Merge alignment + linear upstream tightening + forward re-propagation
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
        if (tightenLinearUpstream(p)) changed = true;
      }
    }
    if (propagateForward()) changed = true;
  }

  let minL = Infinity;
  for (const idx of ids) minL = Math.min(minL, lvl.get(idx) ?? 0);
  for (const idx of ids) lvl.set(idx, (lvl.get(idx) ?? 0) - minL);

  return lvl;
};

const buildBlockLayout = (
  result: Map<number, BBox>,
  idx2level: Map<number, number>,
  ids: number[],
): BlockLayout => {
  const levelLeft = new Map<number, number>();
  const levelRight = new Map<number, number>();
  const levelSet = new Set<number>();
  let bboxLeft = Infinity,
    bboxRight = -Infinity;
  let bboxTop = Infinity,
    bboxBottom = -Infinity;
  let minLevel = Infinity;

  for (const idx of ids) {
    const lv = idx2level.get(idx) ?? 0;
    levelSet.add(lv);
    minLevel = Math.min(minLevel, lv);
    const p = result.get(idx)!;
    levelLeft.set(lv, Math.min(levelLeft.get(lv) ?? Infinity, p.l));
    levelRight.set(lv, Math.max(levelRight.get(lv) ?? -Infinity, p.r));
    bboxLeft = Math.min(bboxLeft, p.l);
    bboxRight = Math.max(bboxRight, p.r);
    bboxTop = Math.min(bboxTop, p.t);
    bboxBottom = Math.max(bboxBottom, p.b);
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

const makeNodeItem = (ctx: LayoutCtx, idx: number): LayoutItem => {
  const lv = ctx.idx2level.get(idx) ?? 0;
  return {
    id: idx,
    kind: "node",
    levels: [lv],
    levelLeft: new Map([[lv, ctx.result.get(idx)!.l]]),
    levelRight: new Map([[lv, ctx.result.get(idx)!.r]]),
    getCenterX: () => ctx.result.get(idx)!.x,
    getIdealX: () => undefined,
    setCenterX: (x: number) => {
      const p = ctx.result.get(idx)!;
      ctx.result.set(idx, bboxFromXYWH(x, p.y, p.w, p.h));
    },
    shiftX: (dx: number) => shiftNodesX(ctx.result, [idx], dx),
  };
};

const makeBlockItem = (
  ctx: LayoutCtx,
  layout: BlockLayout,
  id: number,
): LayoutItem => {
  const refresh = (): BlockLayout =>
    buildBlockLayout(ctx.result, ctx.idx2level, layout.nodeIds);
  return {
    id,
    kind: "block",
    levels: [...layout.levels],
    levelLeft: new Map(layout.levelLeft),
    levelRight: new Map(layout.levelRight),
    getCenterX: () => centerOfBbox(ctx.result, layout.nodeIds).x,
    getIdealX: () => centerOfBbox(ctx.result, layout.nodeIds).x,
    setCenterX: (x: number) => {
      const cur = centerOfBbox(ctx.result, layout.nodeIds).x;
      shiftNodesX(ctx.result, layout.nodeIds, x - cur);
      const next = refresh();
      layout.levels = next.levels;
      layout.levelLeft = next.levelLeft;
      layout.levelRight = next.levelRight;
    },
    shiftX: (dx: number) => {
      shiftNodesX(ctx.result, layout.nodeIds, dx);
      const next = refresh();
      layout.levels = next.levels;
      layout.levelLeft = next.levelLeft;
      layout.levelRight = next.levelRight;
    },
  };
};

const refreshItemBounds = (ctx: LayoutCtx, item: LayoutItem): void => {
  if (item.kind === "node") {
    const lv = item.levels[0];
    const p = ctx.result.get(item.id)!;
    item.levelLeft.set(lv, p.l);
    item.levelRight.set(lv, p.r);
    return;
  }
  const allIds = ctx.blockId2layout.get(item.id)?.nodeIds ?? [];
  const fresh = buildBlockLayout(ctx.result, ctx.idx2level, allIds);
  item.levels = fresh.levels;
  item.levelLeft = fresh.levelLeft;
  item.levelRight = fresh.levelRight;
};

const requiredShift = (
  ctx: LayoutCtx,
  a: LayoutItem,
  b: LayoutItem,
): number => {
  refreshItemBounds(ctx, a);
  refreshItemBounds(ctx, b);
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

const getCompactCentersRight = (
  ctx: LayoutCtx,
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
    const req = requiredShift(ctx, items[i - 1], items[i]);
    centers.push(centers[i - 1] + req);
  }
  return centers;
};

const assignTemporaryIdeals = (
  ctx: LayoutCtx,
  orderedItems: LayoutItem[],
  idealMap: Map<number, number | undefined>,
): Map<number, number> => {
  const temp = new Map<number, number>();
  const base = orderedItems.map((it) => idealMap.get(it.id));

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
      const centers = getCompactCentersRight(ctx, anchorX, chunk);
      for (let k = 1; k < centers.length; k++) {
        temp.set(chunk[k].id, centers[k]);
      }
    } else if (!leftHas && rightHas) {
      const anchorX = base[j]!;
      orderedItems[j].setCenterX(anchorX);
      refreshItemBounds(ctx, orderedItems[j]);
      let rightItem = orderedItems[j];
      let rightX = anchorX;
      for (let k = j - 1; k >= i; k--) {
        const it = orderedItems[k];
        it.setCenterX(rightX);
        refreshItemBounds(ctx, it);
        const req = requiredShift(ctx, it, rightItem);
        const itX = rightX - req;
        temp.set(it.id, itX);
        it.setCenterX(itX);
        refreshItemBounds(ctx, it);
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
  ctx: LayoutCtx,
  orderedItems: LayoutItem[],
  idealMapInput: Map<number, number | undefined>,
): void => {
  if (orderedItems.length === 0) return;

  const hadAnyRealIdeal = [...idealMapInput.values()].some(
    (v) => v !== undefined,
  );
  const tempIdeal = assignTemporaryIdeals(ctx, orderedItems, idealMapInput);

  for (const item of orderedItems) {
    const ix = tempIdeal.get(item.id);
    if (ix !== undefined) item.setCenterX(ix);
    refreshItemBounds(ctx, item);
  }

  let idealLeft = Infinity;
  let idealRight = -Infinity;
  for (const item of orderedItems) {
    const cx = tempIdeal.get(item.id)!;
    refreshItemBounds(ctx, item);
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
    refreshItemBounds(ctx, last);
    for (let i = leftChain.length - 2; i >= 0; i--) {
      const cur = leftChain[i];
      const rightNeighbor = leftChain[i + 1];
      cur.setCenterX(tempIdeal.get(cur.id)!);
      refreshItemBounds(ctx, cur);
      const req = requiredShift(ctx, cur, rightNeighbor);
      const maxCenter = tempIdeal.get(cur.id)! - req;
      cur.setCenterX(Math.min(tempIdeal.get(cur.id)!, maxCenter));
      refreshItemBounds(ctx, cur);
    }
  }

  if (rightChain.length) {
    const first = rightChain[0];
    first.setCenterX(tempIdeal.get(first.id)!);
    refreshItemBounds(ctx, first);
    for (let i = 1; i < rightChain.length; i++) {
      const cur = rightChain[i];
      const leftNeighbor = rightChain[i - 1];
      cur.setCenterX(tempIdeal.get(cur.id)!);
      refreshItemBounds(ctx, cur);
      const req = requiredShift(ctx, leftNeighbor, cur);
      const minCenter = tempIdeal.get(cur.id)! + req;
      cur.setCenterX(Math.max(tempIdeal.get(cur.id)!, minCenter));
      refreshItemBounds(ctx, cur);
    }
  }

  if (!hadAnyRealIdeal) {
    let l = Infinity;
    let r = -Infinity;
    for (const item of orderedItems) {
      refreshItemBounds(ctx, item);
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
    refreshItemBounds(ctx, item);
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

const parentMedian = (ctx: LayoutCtx, idx: number): number => {
  const nxt = ctx.idx2chain.get(idx)?.nxt;
  const xs: number[] = [];
  for (const j of nxt ?? []) {
    if (!ctx.result.has(j)) continue;
    xs.push(ctx.result.get(j)!.x);
  }
  return xs.length ? median(xs) : NaN;
};

const childMedian = (ctx: LayoutCtx, layout: BlockLayout): number => {
  const topLevel = layout.minLevel;
  const xs: number[] = [];
  for (const idx of layout.nodeIds) {
    if ((ctx.idx2level.get(idx) ?? 0) === topLevel)
      xs.push(ctx.result.get(idx)!.x);
  }
  return xs.length ? median(xs) : centerOfBbox(ctx.result, layout.nodeIds).x;
};

const kinship = (idx2chain: ChainMap, a: number, b: number): number => {
  const an = idx2chain.get(a)?.nxt;
  const bn = idx2chain.get(b)?.nxt;
  let cnt = 0;
  for (const x of an ?? []) if (bn?.has(x)) cnt++;
  return cnt;
};

const orderChildren = (
  ctx: LayoutCtx,
  children: BlockLayout[],
): BlockLayout[] => {
  return [...children].sort((a, b) => {
    const ma = childMedian(ctx, a);
    const mb = childMedian(ctx, b);
    if (Math.abs(ma - mb) > EPS_MEDIAN) return ma - mb;
    const xa = centerOfBbox(ctx.result, a.nodeIds).x;
    const xb = centerOfBbox(ctx.result, b.nodeIds).x;
    if (Math.abs(xa - xb) > EPS_MEDIAN) return xa - xb;
    const ia = Math.min(...a.nodeIds);
    const ib = Math.min(...b.nodeIds);
    return ia - ib;
  });
};

const compactPlaceChildren = (
  ctx: LayoutCtx,
  children: BlockLayout[],
): void => {
  if (children.length === 0) return;
  const items = children.map((child) => {
    const id = ctx.nextBlockId++;
    ctx.blockId2layout.set(id, child);
    return makeBlockItem(ctx, child, id);
  });

  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const cur = items[i];
    const dx = requiredShift(ctx, prev, cur);
    cur.shiftX(dx);
  }
};

const orderParentNodes = (ctx: LayoutCtx, ids: number[]): number[] => {
  const ordered = [...ids].sort((a, b) => {
    const ma = parentMedian(ctx, a);
    const mb = parentMedian(ctx, b);
    const aHas = !Number.isNaN(ma);
    const bHas = !Number.isNaN(mb);
    if (aHas && bHas && Math.abs(ma - mb) > EPS_MEDIAN) return ma - mb;
    if (aHas !== bHas) return aHas ? -1 : 1;
    const xa = ctx.result.get(a)!.x;
    const xb = ctx.result.get(b)!.x;
    if (Math.abs(xa - xb) > EPS_MEDIAN) return xa - xb;
    return a - b;
  });

  // Kinship heuristic: one-pass adjacent local swap within same median group.
  let i = 0;
  while (i < ordered.length) {
    const m = parentMedian(ctx, ordered[i]);
    let j = i + 1;
    while (
      j < ordered.length &&
      ((Number.isNaN(m) && Number.isNaN(parentMedian(ctx, ordered[j]))) ||
        Math.abs(parentMedian(ctx, ordered[j]) - m) <= EPS_MEDIAN)
    ) {
      j++;
    }
    for (let k = i; k + 2 < j; k++) {
      const a = ordered[k];
      const b = ordered[k + 1];
      const c = ordered[k + 2];
      if (kinship(ctx.idx2chain, a, c) > kinship(ctx.idx2chain, a, b)) {
        ordered[k + 1] = c;
        ordered[k + 2] = b;
      }
    }
    i = j;
  }

  return ordered;
};

const layoutBlock = (ctx: LayoutCtx, blockNodeIds: number[]): BlockLayout => {
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
    minLevel = Math.min(minLevel, ctx.idx2level.get(idx) ?? 0);

  const parentNodes = blockNodeIds.filter(
    (idx) => (ctx.idx2level.get(idx) ?? 0) === minLevel,
  );
  const rest = blockNodeIds.filter((idx) => !parentNodes.includes(idx));

  const childrenComps = connectedComponentsUndirected(ctx.idx2chain, rest);
  const childLayouts = childrenComps.map((comp) => layoutBlock(ctx, comp));

  const orderedChildren = orderChildren(ctx, childLayouts);
  compactPlaceChildren(ctx, orderedChildren);

  const orderedParent = orderParentNodes(ctx, parentNodes);
  const items = orderedParent.map((idx) => makeNodeItem(ctx, idx));

  const idealMap = new Map<number, number | undefined>();
  for (const idx of orderedParent) {
    const nxt = ctx.idx2chain.get(idx)?.nxt;
    const xs: number[] = [];
    let minL = Infinity;
    let maxR = -Infinity;
    for (const j of nxt ?? []) {
      if (!blockSet.has(j)) continue;
      xs.push(ctx.result.get(j)!.x);
      minL = Math.min(minL, ctx.result.get(j)!.l);
      maxR = Math.max(maxR, ctx.result.get(j)!.r);
    }
    idealMap.set(idx, xs.length === 0 ? undefined : (minL + maxR) / 2);
  }

  bilateralSweep(ctx, items, idealMap);
  return buildBlockLayout(ctx.result, ctx.idx2level, blockNodeIds);
};

const computeAutoLayout = (
  idx2chain: ChainMap,
  bboxMap: Map<number, BBox>,
): Map<number, BBox> => {
  const result = new Map<number, BBox>();
  const nodeIds = [...bboxMap.keys()];

  const partitionIds = connectedComponentsUndirected(idx2chain, nodeIds);
  const idx2part = new Map<number, number>();
  partitionIds.forEach((ids, partId) => {
    for (const idx of ids) idx2part.set(idx, partId);
  });

  const idx2level = new Map<number, number>();
  partitionIds.forEach((ids) => {
    const partLevels = computeLevelsForPartition(idx2chain, ids);
    for (const [idx, lv] of partLevels) idx2level.set(idx, lv);
  });

  for (const idx of nodeIds) {
    const node = bboxMap.get(idx)!;
    result.set(idx, bboxFromXYWH(node.x, node.y, node.w, node.h));
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

  for (let partId = 0; partId < partitionIds.length; partId++) {
    const rowMap = rowIdsByPartition.get(partId)!;
    const levels = [...rowMap.keys()].sort((a, b) => a - b);
    const rowHeight = new Map<number, number>();
    for (const lv of levels) {
      let h = 0;
      for (const idx of rowMap.get(lv) ?? []) h = Math.max(h, bboxMap.get(idx)!.h);
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
        result.set(idx, bboxFromXYWH(p.x, y, p.w, p.h));
      }
    }
  }

  const ctx: LayoutCtx = {
    result,
    idx2chain,
    idx2level,
    blockId2layout: new Map<number, BlockLayout>(),
    nextBlockId: 1_000_000_000,
  };

  const partitionLayouts: BlockLayout[] = [];
  for (let partId = 0; partId < partitionIds.length; partId++) {
    partitionLayouts.push(layoutBlock(ctx, partitionIds[partId]));
  }

  // Place partitions left-to-right.
  const orderedPartitions = [...partitionLayouts].sort((a, b) => {
    const xa = centerOfBbox(result, a.nodeIds).x;
    const xb = centerOfBbox(result, b.nodeIds).x;
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
    const prev = buildBlockLayout(result, idx2level, orderedPartitions[i - 1].nodeIds);
    const cur = buildBlockLayout(result, idx2level, orderedPartitions[i].nodeIds);
    const prevItem = makeBlockItem(ctx, prev, ctx.nextBlockId++);
    ctx.blockId2layout.set(prevItem.id, prev);
    const curItem = makeBlockItem(ctx, cur, ctx.nextBlockId++);
    ctx.blockId2layout.set(curItem.id, cur);

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
    shiftNodesY(result, ids, dy);
  }

  // Final normalize to center (0, 0).
  if (nodeIds.length) {
    let l = Infinity,
      r = -Infinity,
      t = Infinity,
      b = -Infinity;
    for (const idx of nodeIds) {
      const p = result.get(idx)!;
      l = Math.min(l, p.l);
      r = Math.max(r, p.r);
      t = Math.min(t, p.t);
      b = Math.max(b, p.b);
    }
    shiftNodesX(result, nodeIds, -(l + r) / 2);
    shiftNodesY(result, nodeIds, -(t + b) / 2);
  }

  return result;
};

export { computeAutoLayout };
