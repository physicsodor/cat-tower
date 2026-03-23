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
  bboxMap: Map<number, BBox>;
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

const groupedProjection = (
  ctx: LayoutCtx,
  orderedItems: LayoutItem[],
  idealMap: Map<number, number>,
): void => {
  if (orderedItems.length === 0) return;

  type Group = {
    start: number; // index into orderedItems (inclusive)
    end: number;   // index into orderedItems (inclusive)
    idealSum: number; // sum of all member ideals
  };

  const groups: Group[] = orderedItems.map((item, i) => ({
    start: i,
    end: i,
    idealSum: idealMap.get(item.id)!,
  }));

  // Compact-pack items in a group and center them at `center` (mean of positions).
  const packGroup = (g: Group, center: number): void => {
    const items = orderedItems.slice(g.start, g.end + 1);
    // Place items[0] at 0, each subsequent at (0 + requiredShift from previous).
    // requiredShift(prev, cur) with cur placed at 0 gives exactly the tight-pack position.
    items[0].setCenterX(0);
    refreshItemBounds(ctx, items[0]);
    for (let k = 1; k < items.length; k++) {
      items[k].setCenterX(0);
      refreshItemBounds(ctx, items[k]);
      const req = requiredShift(ctx, items[k - 1], items[k]);
      items[k].setCenterX(req);
      refreshItemBounds(ctx, items[k]);
    }
    // Shift so that the mean of item positions equals `center`.
    const mean =
      items.reduce((s, it) => s + it.getCenterX(), 0) / items.length;
    const shift = center - mean;
    for (const item of items) {
      item.shiftX(shift);
      refreshItemBounds(ctx, item);
    }
  };

  // Merge groups[gi] and groups[gi+1] into groups[gi].
  const mergeGroups = (gi: number): void => {
    const a = groups[gi];
    const b = groups[gi + 1];
    const countA = a.end - a.start + 1;
    const countB = b.end - b.start + 1;
    const mergedIdeal = (a.idealSum + b.idealSum) / (countA + countB);
    a.end = b.end;
    a.idealSum = a.idealSum + b.idealSum;
    groups.splice(gi + 1, 1);
    packGroup(a, mergedIdeal);
  };

  // Initial placement: each item at its ideal.
  for (const item of orderedItems) {
    item.setCenterX(idealMap.get(item.id)!);
    refreshItemBounds(ctx, item);
  }

  // Left-to-right scan with leftward cascade on merge.
  let i = 1;
  while (i < groups.length) {
    const prevLastItem = orderedItems[groups[i - 1].end];
    const curFirstItem = orderedItems[groups[i].start];
    const req = requiredShift(ctx, prevLastItem, curFirstItem);
    if (req > 0) {
      mergeGroups(i - 1);
      if (i - 1 > 0) i = i - 1; // cascade left
    } else {
      i++;
    }
  }

  // Final uniform shift: move all items so mean(positions) = mean(ideals).
  // This minimises Σ(pos_i − ideal_i)² over a uniform translation.
  const meanIdeal =
    orderedItems.reduce((s, it) => s + idealMap.get(it.id)!, 0) /
    orderedItems.length;
  const meanPos =
    orderedItems.reduce((s, it) => s + it.getCenterX(), 0) /
    orderedItems.length;
  const finalShift = meanIdeal - meanPos;
  if (Math.abs(finalShift) > EPS_MEDIAN)
    for (const item of orderedItems) item.shiftX(finalShift);
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

const originalCenterX = (ctx: LayoutCtx, nodeIds: number[]): number => {
  let l = Infinity,
    r = -Infinity;
  for (const id of nodeIds) {
    const b = ctx.bboxMap.get(id);
    if (b) {
      l = Math.min(l, b.l);
      r = Math.max(r, b.r);
    }
  }
  return Number.isFinite(l) ? (l + r) / 2 : centerOfBbox(ctx.result, nodeIds).x;
};

const childMedian = (ctx: LayoutCtx, layout: BlockLayout): number => {
  const topLevel = layout.minLevel;
  const xs: number[] = [];
  for (const idx of layout.nodeIds) {
    if ((ctx.idx2level.get(idx) ?? 0) === topLevel) {
      const ox = ctx.bboxMap.get(idx)?.x;
      xs.push(ox ?? ctx.result.get(idx)!.x);
    }
  }
  return xs.length ? median(xs) : originalCenterX(ctx, layout.nodeIds);
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
    const xa = originalCenterX(ctx, a.nodeIds);
    const xb = originalCenterX(ctx, b.nodeIds);
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

  for (const item of items) item.setCenterX(0);

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
    const xa = ctx.bboxMap.get(a)?.x ?? ctx.result.get(a)!.x;
    const xb = ctx.bboxMap.get(b)?.x ?? ctx.result.get(b)!.x;
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

  const idealMap = new Map<number, number>();
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
    const childIdeal = xs.length === 0 ? undefined : (minL + maxR) / 2;
    // Fall back to original bbox x if no child constraint; dummy nodes have no bboxMap entry so use current position
    idealMap.set(idx, childIdeal ?? ctx.bboxMap.get(idx)?.x ?? ctx.result.get(idx)!.x);
  }

  groupedProjection(ctx, items, idealMap);
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
    bboxMap,
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
