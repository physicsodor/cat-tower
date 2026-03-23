import { LAYOUT_COL_GAP, LAYOUT_PART_GAP, LAYOUT_ROW_GAP } from "../constants";
import { getPartition } from "@/lib/Chain/chain";
import type { ChainMap } from "@/lib/Chain/chain";
import { bboxFromXYWH, type BBox } from "../model/rect";
import { computeLevelsForPartition } from "./computeLevels";

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
  return sorted.length % 2 === 1 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};

const shiftNodes = (
  result: Map<number, BBox>,
  ids: number[],
  dx: number,
  dy: number,
): void => {
  if (Math.abs(dx) <= EPS_MEDIAN && Math.abs(dy) <= EPS_MEDIAN) return;
  for (const idx of ids) {
    const p = result.get(idx)!;
    result.set(idx, bboxFromXYWH(p.x + dx, p.y + dy, p.w, p.h));
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
    shiftX: (dx: number) => shiftNodes(ctx.result, [idx], dx, 0),
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
      shiftNodes(ctx.result, layout.nodeIds, x - cur, 0);
      const next = refresh();
      layout.levels = next.levels;
      layout.levelLeft = next.levelLeft;
      layout.levelRight = next.levelRight;
    },
    shiftX: (dx: number) => {
      shiftNodes(ctx.result, layout.nodeIds, dx, 0);
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

const getCompactCentersLeft = (
  ctx: LayoutCtx,
  anchorX: number,
  items: LayoutItem[],
): number[] => {
  const centers: number[] = new Array(items.length);
  centers[items.length - 1] = anchorX;
  for (let i = items.length - 2; i >= 0; i--) {
    items[i].setCenterX(anchorX);
    items[i + 1].setCenterX(centers[i + 1]);
    const req = requiredShift(ctx, items[i], items[i + 1]);
    centers[i] = centers[i + 1] - req;
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
      const chunk = orderedItems.slice(i, j + 1);
      const centers = getCompactCentersLeft(ctx, anchorX, chunk);
      for (let k = 0; k < chunk.length - 1; k++) {
        temp.set(chunk[k].id, centers[k]);
      }
    } else {
      const chunk = orderedItems.slice(i, j);
      for (const it of chunk) temp.set(it.id, it.getCenterX());
    }
    i = j;
  }

  return temp;
};

const calcItemsCenter = (ctx: LayoutCtx, items: LayoutItem[]): number => {
  let l = Infinity,
    r = -Infinity;
  for (const item of items) {
    refreshItemBounds(ctx, item);
    for (const lv of item.levels) {
      l = Math.min(l, item.levelLeft.get(lv) ?? Infinity);
      r = Math.max(r, item.levelRight.get(lv) ?? -Infinity);
    }
  }
  return (l + r) / 2;
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

  const sweepChain = (chain: LayoutItem[], dir: "left" | "right"): void => {
    if (chain.length === 0) return;
    const anchor = dir === "left" ? chain[chain.length - 1] : chain[0];
    anchor.setCenterX(tempIdeal.get(anchor.id)!);
    refreshItemBounds(ctx, anchor);
    if (dir === "left") {
      for (let i = chain.length - 2; i >= 0; i--) {
        const cur = chain[i];
        cur.setCenterX(tempIdeal.get(cur.id)!);
        refreshItemBounds(ctx, cur);
        const req = requiredShift(ctx, cur, chain[i + 1]);
        cur.setCenterX(tempIdeal.get(cur.id)! - req);
        refreshItemBounds(ctx, cur);
      }
    } else {
      for (let i = 1; i < chain.length; i++) {
        const cur = chain[i];
        cur.setCenterX(tempIdeal.get(cur.id)!);
        refreshItemBounds(ctx, cur);
        const req = requiredShift(ctx, chain[i - 1], cur);
        cur.setCenterX(tempIdeal.get(cur.id)! + req);
        refreshItemBounds(ctx, cur);
      }
    }
  };

  sweepChain(orderedItems.slice(0, split + 1), "left");
  sweepChain(orderedItems.slice(split + 1), "right");

  if (!hadAnyRealIdeal) {
    const center = calcItemsCenter(ctx, orderedItems);
    for (const item of orderedItems) item.shiftX(-center);
    return;
  }

  const currentCenter = calcItemsCenter(ctx, orderedItems);
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
    let maxDx = 0;
    for (let j = 0; j < i; j++) {
      maxDx = Math.max(maxDx, requiredShift(ctx, items[j], items[i]));
    }
    items[i].shiftX(maxDx);
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

  const childrenComps = getPartition(ctx.idx2chain, rest);
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

const DUMMY_ID_START = 500_000_000;

const insertDummyNodes = (
  idx2chain: ChainMap,
  idx2level: Map<number, number>,
  realNodeIdSet: Set<number>,
): {
  localChain: ChainMap;
  dummyIds: Set<number>;
  dummyLevel: Map<number, number>;
  dummyToReal: Map<number, number>;
} => {
  const localChain: ChainMap = new Map();
  for (const [id, info] of idx2chain) {
    if (!realNodeIdSet.has(id)) continue;
    localChain.set(id, {
      pre: new Set(info.pre ?? []),
      nxt: new Set(info.nxt ?? []),
    });
  }

  const dummyIds = new Set<number>();
  const dummyLevel = new Map<number, number>();
  const dummyToReal = new Map<number, number>();
  let nextDummyId = DUMMY_ID_START;

  const allocDummyId = (): number => {
    while (realNodeIdSet.has(nextDummyId) || dummyIds.has(nextDummyId))
      nextDummyId++;
    return nextDummyId++;
  };

  for (const fromId of realNodeIdSet) {
    const lvA = idx2level.get(fromId) ?? 0;
    for (const toId of idx2chain.get(fromId)?.nxt ?? []) {
      if (!realNodeIdSet.has(toId)) continue;
      const lvB = idx2level.get(toId) ?? 0;
      if (lvB - lvA < 2) continue;

      localChain.get(fromId)!.nxt!.delete(toId);
      localChain.get(toId)!.pre!.delete(fromId);

      const chain: number[] = [fromId];
      for (let lv = lvA + 1; lv < lvB; lv++) {
        const dId = allocDummyId();
        dummyIds.add(dId);
        dummyLevel.set(dId, lv);
        dummyToReal.set(dId, fromId);
        localChain.set(dId, { pre: new Set(), nxt: new Set() });
        chain.push(dId);
      }
      chain.push(toId);

      for (let i = 0; i < chain.length - 1; i++) {
        localChain.get(chain[i])!.nxt!.add(chain[i + 1]);
        localChain.get(chain[i + 1])!.pre!.add(chain[i]);
      }
    }
  }

  return { localChain, dummyIds, dummyLevel, dummyToReal };
};

const computeAutoLayout = (
  idx2chain: ChainMap,
  bboxMap: Map<number, BBox>,
): Map<number, BBox> => {
  const result = new Map<number, BBox>();
  const nodeIds = [...bboxMap.keys()];
  const realNodeIdSet = new Set(nodeIds);

  const partitionIdsInit = getPartition(idx2chain, nodeIds);

  const idx2level = new Map<number, number>();
  partitionIdsInit.forEach((ids) => {
    const partLevels = computeLevelsForPartition(idx2chain, ids);
    for (const [idx, lv] of partLevels) idx2level.set(idx, lv);
  });

  for (const idx of nodeIds) {
    const node = bboxMap.get(idx)!;
    result.set(idx, bboxFromXYWH(node.x, node.y, node.w, node.h));
  }

  // Assign Y coordinates (real nodes only).
  partitionIdsInit.forEach((ids) => {
    const rowMap = new Map<number, number[]>();
    for (const idx of ids) {
      const lv = idx2level.get(idx) ?? 0;
      if (!rowMap.has(lv)) rowMap.set(lv, []);
      rowMap.get(lv)!.push(idx);
    }
    const levels = [...rowMap.keys()].sort((a, b) => a - b);
    const rowHeight = new Map<number, number>();
    for (const lv of levels) {
      let h = 0;
      for (const idx of rowMap.get(lv) ?? [])
        h = Math.max(h, bboxMap.get(idx)!.h);
      rowHeight.set(lv, h);
    }
    const rowY = new Map<number, number>();
    if (levels.length) rowY.set(levels[0], 0);
    for (let i = 1; i < levels.length; i++) {
      const prev = levels[i - 1];
      const cur = levels[i];
      rowY.set(
        cur,
        (rowY.get(prev) ?? 0) +
          (rowHeight.get(prev) ?? 0) / 2 +
          LAYOUT_ROW_GAP +
          (rowHeight.get(cur) ?? 0) / 2,
      );
    }
    for (const lv of levels) {
      const y = rowY.get(lv) ?? 0;
      for (const idx of rowMap.get(lv) ?? []) {
        const p = result.get(idx)!;
        result.set(idx, bboxFromXYWH(p.x, y, p.w, p.h));
      }
    }
  });

  // Insert dummy nodes for long edges (level diff >= 2).
  const { localChain, dummyIds, dummyLevel, dummyToReal } = insertDummyNodes(
    idx2chain,
    idx2level,
    realNodeIdSet,
  );
  for (const [dId, lv] of dummyLevel) idx2level.set(dId, lv);
  for (const dId of dummyIds)
    result.set(dId, bboxFromXYWH(0, 0, -LAYOUT_COL_GAP, 0));
  const allLayoutIds = [...nodeIds, ...dummyIds];

  // Assign partition IDs: real nodes from partitionIdsInit, dummy nodes directly from dummyToReal.
  const idx2part = new Map<number, number>();
  partitionIdsInit.forEach((ids, partId) => {
    for (const idx of ids) idx2part.set(idx, partId);
  });
  for (const [dId, realId] of dummyToReal)
    idx2part.set(dId, idx2part.get(realId)!);
  const partitionIds: number[][] = partitionIdsInit.map(() => []);
  for (const idx of allLayoutIds) partitionIds[idx2part.get(idx)!].push(idx);

  const ctx: LayoutCtx = {
    result,
    idx2chain: localChain,
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
    const prev = buildBlockLayout(
      result,
      idx2level,
      orderedPartitions[i - 1].nodeIds,
    );
    const cur = buildBlockLayout(
      result,
      idx2level,
      orderedPartitions[i].nodeIds,
    );
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

  // Final normalize to center (0, 0). Bounds from real nodes only.
  if (nodeIds.length) {
    const c = centerOfBbox(result, nodeIds);
    shiftNodes(result, allLayoutIds, -c.x, -c.y);
  }

  // Remove dummy nodes from result.
  for (const dId of dummyIds) result.delete(dId);

  return result;
};

export { computeAutoLayout };
