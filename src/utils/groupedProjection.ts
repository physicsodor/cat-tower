import { bboxFromXYWH, type BBox } from "@/lib/BBox/bbox";
import { LAYOUT_COL_GAP } from "@/lib/constants";
import type { ChainMap } from "@/lib/Chain/chain";

export const EPS_MEDIAN = 1e-6;

export type BlockLayout = {
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

export type LayoutItem = {
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

export type LayoutCtx = {
  result: Map<number, BBox>;
  idx2chain: ChainMap;
  idx2level: Map<number, number>;
  blockId2layout: Map<number, BlockLayout>;
  nextBlockId: number;
  bboxMap: Map<number, BBox>;
};

export const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};

export const shiftNodes = (
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

export const centerOfBbox = (
  result: Map<number, BBox>,
  ids: number[],
): { x: number; y: number } => {
  let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
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

export const buildBlockLayout = (
  result: Map<number, BBox>,
  idx2level: Map<number, number>,
  ids: number[],
): BlockLayout => {
  const levelLeft = new Map<number, number>();
  const levelRight = new Map<number, number>();
  const levelSet = new Set<number>();
  let bboxLeft = Infinity, bboxRight = -Infinity;
  let bboxTop = Infinity, bboxBottom = -Infinity;
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

export const makeNodeItem = (ctx: LayoutCtx, idx: number): LayoutItem => {
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

export const makeBlockItem = (
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

export const refreshItemBounds = (ctx: LayoutCtx, item: LayoutItem): void => {
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

export const requiredShift = (
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

export const groupedProjection = (
  ctx: LayoutCtx,
  orderedItems: LayoutItem[],
  idealMap: Map<number, number>,
): void => {
  if (orderedItems.length === 0) return;

  type Group = {
    start: number;
    end: number;
    idealSum: number;
  };

  const groups: Group[] = orderedItems.map((item, i) => ({
    start: i,
    end: i,
    idealSum: idealMap.get(item.id)!,
  }));

  const packGroup = (g: Group, center: number): void => {
    const items = orderedItems.slice(g.start, g.end + 1);
    items[0].setCenterX(0);
    refreshItemBounds(ctx, items[0]);
    for (let k = 1; k < items.length; k++) {
      items[k].setCenterX(0);
      refreshItemBounds(ctx, items[k]);
      const req = requiredShift(ctx, items[k - 1], items[k]);
      items[k].setCenterX(req);
      refreshItemBounds(ctx, items[k]);
    }
    const mean =
      items.reduce((s, it) => s + it.getCenterX(), 0) / items.length;
    const shift = center - mean;
    for (const item of items) {
      item.shiftX(shift);
      refreshItemBounds(ctx, item);
    }
  };

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

  for (const item of orderedItems) {
    item.setCenterX(idealMap.get(item.id)!);
    refreshItemBounds(ctx, item);
  }

  let i = 1;
  while (i < groups.length) {
    const prevLastItem = orderedItems[groups[i - 1].end];
    const curFirstItem = orderedItems[groups[i].start];
    const req = requiredShift(ctx, prevLastItem, curFirstItem);
    if (req > 0) {
      mergeGroups(i - 1);
      if (i - 1 > 0) i = i - 1;
    } else {
      i++;
    }
  }

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
