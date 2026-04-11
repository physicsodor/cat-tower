import { LAYOUT_COL_GAP, LAYOUT_PART_GAP, LAYOUT_ROW_GAP } from "@/lib/constants";
import { getPartition } from "@/lib/Chain/chainOp";
import type { ChainMap } from "@/lib/Chain/chain";
import { bboxFromXYWH, type BBox } from "@/lib/rect";
import { computeLevelsForPartition } from "./computeLevels";
import { insertDummyNodes } from "./dummyNodes";
import {
  EPS_MEDIAN,
  median,
  shiftNodes,
  centerOfBbox,
  buildBlockLayout,
  makeNodeItem,
  makeBlockItem,
  requiredShift,
  groupedProjection,
  type BlockLayout,
  type LayoutCtx,
} from "./groupedProjection";

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
  let l = Infinity, r = -Infinity;
  for (const id of nodeIds) {
    const b = ctx.bboxMap.get(id);
    if (b) {
      l = Math.min(l, b.l);
      r = Math.max(r, b.r);
    }
  }
  return Number.isFinite(l) ? (l + r) / 2 : centerOfBbox(ctx.result, nodeIds).x;
};

const subBlockMedian = (ctx: LayoutCtx, layout: BlockLayout): number => {
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

const orderSubBlocks = (
  ctx: LayoutCtx,
  subBlocks: BlockLayout[],
): BlockLayout[] => {
  return [...subBlocks].sort((a, b) => {
    const ma = subBlockMedian(ctx, a);
    const mb = subBlockMedian(ctx, b);
    if (Math.abs(ma - mb) > EPS_MEDIAN) return ma - mb;
    const xa = originalCenterX(ctx, a.nodeIds);
    const xb = originalCenterX(ctx, b.nodeIds);
    if (Math.abs(xa - xb) > EPS_MEDIAN) return xa - xb;
    const ia = Math.min(...a.nodeIds);
    const ib = Math.min(...b.nodeIds);
    return ia - ib;
  });
};

const compactPlaceSubBlocks = (
  ctx: LayoutCtx,
  subBlocks: BlockLayout[],
): void => {
  if (subBlocks.length === 0) return;
  const items = subBlocks.map((subBlock) => {
    const id = ctx.nextBlockId++;
    ctx.blockId2layout.set(id, subBlock);
    return makeBlockItem(ctx, subBlock, id);
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

  const subBlockComps = getPartition(ctx.idx2chain, rest);
  const subBlockLayouts = subBlockComps.map((comp) => layoutBlock(ctx, comp));

  const orderedSubBlocks = orderSubBlocks(ctx, subBlockLayouts);
  compactPlaceSubBlocks(ctx, orderedSubBlocks);

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
    idealMap.set(idx, childIdeal ?? ctx.bboxMap.get(idx)?.x ?? ctx.result.get(idx)!.x);
  }

  groupedProjection(ctx, items, idealMap);
  return buildBlockLayout(ctx.result, ctx.idx2level, blockNodeIds);
};

const computeAutoLayout = (
  idx2chain: ChainMap,
  bboxMap: Map<number, BBox>,
): Map<number, BBox> => {
  const result = new Map<number, BBox>();
  const nodeIds = [...bboxMap.keys()];
  const realNodeIdSet = new Set(nodeIds);

  const connComps = getPartition(idx2chain, nodeIds);

  const idx2level = new Map<number, number>();
  connComps.forEach((ids) => {
    const partLevels = computeLevelsForPartition(idx2chain, ids);
    for (const [idx, lv] of partLevels) idx2level.set(idx, lv);
  });

  for (const idx of nodeIds) {
    const node = bboxMap.get(idx)!;
    result.set(idx, bboxFromXYWH(node.x, node.y, node.w, node.h));
  }

  connComps.forEach((ids) => {
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

  const { localChain, dummyIds, dummyLevel, dummyToReal } = insertDummyNodes(
    idx2chain,
    idx2level,
    realNodeIdSet,
  );
  for (const [dId, lv] of dummyLevel) idx2level.set(dId, lv);
  for (const dId of dummyIds)
    result.set(dId, bboxFromXYWH(0, 0, -LAYOUT_COL_GAP, 0));
  const allLayoutIds = [...nodeIds, ...dummyIds];

  const idx2part = new Map<number, number>();
  connComps.forEach((ids, partId) => {
    for (const idx of ids) idx2part.set(idx, partId);
  });
  for (const [dId, realId] of dummyToReal)
    idx2part.set(dId, idx2part.get(realId)!);
  const partAllIds: number[][] = connComps.map(() => []);
  for (const idx of allLayoutIds) partAllIds[idx2part.get(idx)!].push(idx);

  const ctx: LayoutCtx = {
    result,
    idx2chain: localChain,
    idx2level,
    blockId2layout: new Map<number, BlockLayout>(),
    nextBlockId: 1_000_000_000,
    bboxMap,
  };

  const partLayouts: BlockLayout[] = [];
  for (let partId = 0; partId < partAllIds.length; partId++) {
    partLayouts.push(layoutBlock(ctx, partAllIds[partId]));
  }

  const orderedPartitions = [...partLayouts].sort((a, b) => {
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
    const req = prev.bboxRight + LAYOUT_PART_GAP - cur.bboxLeft;
    shiftNodes(result, cur.nodeIds, req, 0);
  }

  if (nodeIds.length) {
    const c = centerOfBbox(result, nodeIds);
    shiftNodes(result, allLayoutIds, -c.x, -c.y);
  }

  for (const dId of dummyIds) result.delete(dId);

  return result;
};

export { computeAutoLayout };
