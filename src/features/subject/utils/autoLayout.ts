import {
  buildChainLevelMap,
  getPartition,
  type ChainMap,
} from "../types/Chain/chainOp";
import type { SbjMap } from "../types/Curriculum/curriculumOp";
import {
  LAYOUT_ROW_GAP as ROW_GAP,
  LAYOUT_COL_GAP as COL_GAP,
  LAYOUT_DEFAULT_W as DEFAULT_W,
  LAYOUT_DEFAULT_H as DEFAULT_H,
  LAYOUT_ITER as ITER,
  LAYOUT_PARTITION_GAP as PARTITION_GAP,
} from "../constants";

const getW = (idx: number, sizes?: Map<number, { w: number; h: number }>) =>
  sizes?.get(idx)?.w ?? DEFAULT_W;

const getH = (idx: number, sizes?: Map<number, { w: number; h: number }>) =>
  sizes?.get(idx)?.h ?? DEFAULT_H;

const getOrigX = (idx: number, idx2sbj: SbjMap): number => {
  const info = idx2sbj.get(idx);
  return info?.sbjType === "SUBJECT" ? info.x : 0;
};

/** Two-pass placement enforcing COL_GAP between adjacent nodes at a level. */
function placeLevel(
  sortedIdxs: number[],
  idealX: number[],
  pos: Map<number, number>,
  sizes?: Map<number, { w: number; h: number }>,
): void {
  if (sortedIdxs.length === 0) return;
  const x = [...idealX];

  // Forward pass
  for (let i = 1; i < sortedIdxs.length; i++) {
    const prev = sortedIdxs[i - 1];
    const cur = sortedIdxs[i];
    const minX = x[i - 1] + getW(prev, sizes) / 2 + COL_GAP + getW(cur, sizes) / 2;
    if (x[i] < minX) x[i] = minX;
  }

  // Backward pass
  for (let i = sortedIdxs.length - 2; i >= 0; i--) {
    const cur = sortedIdxs[i];
    const next = sortedIdxs[i + 1];
    const maxX = x[i + 1] - getW(next, sizes) / 2 - COL_GAP - getW(cur, sizes) / 2;
    if (x[i] > maxX) x[i] = maxX;
  }

  for (let i = 0; i < sortedIdxs.length; i++) {
    pos.set(sortedIdxs[i], x[i]);
  }
}

/** Center of the bounding box of nxt nodes already in pos (house center). */
function computeIdealXFromNxt(
  idx: number,
  idx2chain: ChainMap,
  pos: Map<number, number>,
  sizes?: Map<number, { w: number; h: number }>,
): number | null {
  const nxt = idx2chain.get(idx)?.nxt;
  if (!nxt) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const n of nxt) {
    const nx = pos.get(n);
    if (nx === undefined) continue;
    const hw = getW(n, sizes) / 2;
    if (nx - hw < minX) minX = nx - hw;
    if (nx + hw > maxX) maxX = nx + hw;
  }
  if (!isFinite(minX)) return null;
  return (minX + maxX) / 2;
}

/** Lower median of pre nodes already in pos. */
function computeIdealXFromPre(
  idx: number,
  idx2chain: ChainMap,
  pos: Map<number, number>,
): number | null {
  const pre = idx2chain.get(idx)?.pre;
  if (!pre) return null;
  const xs: number[] = [];
  for (const p of pre) {
    const px = pos.get(p);
    if (px !== undefined) xs.push(px);
  }
  if (xs.length === 0) return null;
  xs.sort((a, b) => a - b);
  return xs[Math.floor((xs.length - 1) / 2)];
}

export const computeAutoLayout = (
  idx2chain: ChainMap,
  idx2sbj: SbjMap,
  sizes?: Map<number, { w: number; h: number }>,
): Map<number, { x: number; y: number }> => {
  if (idx2chain.size === 0) return new Map();

  const partition = getPartition(idx2chain);
  const idx2level = buildChainLevelMap(idx2chain, partition);

  // ── Phase 2: Global level → Y ────────────────────────────────────────────
  const globalLevel2idxs = new Map<number, number[]>();
  for (const [idx, lv] of idx2level) {
    let arr = globalLevel2idxs.get(lv);
    if (!arr) { arr = []; globalLevel2idxs.set(lv, arr); }
    arr.push(idx);
  }
  const allLevels = [...globalLevel2idxs.keys()].sort((a, b) => a - b);
  const level2y = new Map<number, number>();
  level2y.set(allLevels[0], 0);
  for (let i = 1; i < allLevels.length; i++) {
    const lv = allLevels[i];
    const prevLv = allLevels[i - 1];
    const prevMaxH = Math.max(...globalLevel2idxs.get(prevLv)!.map((idx) => getH(idx, sizes)));
    const curMaxH = Math.max(...globalLevel2idxs.get(lv)!.map((idx) => getH(idx, sizes)));
    level2y.set(lv, level2y.get(prevLv)! + prevMaxH / 2 + ROW_GAP + curMaxH / 2);
  }

  // ── Phase 3: Per-partition X layout ──────────────────────────────────────
  const partitionLayouts: { layout: Map<number, { x: number; y: number }>; origCX: number }[] = [];

  for (const comp of partition) {
    if (comp.length === 0) continue;

    const origCX = comp.reduce((s, idx) => s + getOrigX(idx, idx2sbj), 0) / comp.length;

    // Group by level, sort each level by original x
    const compLevel2idxs = new Map<number, number[]>();
    for (const idx of comp) {
      const lv = idx2level.get(idx) ?? 0;
      let arr = compLevel2idxs.get(lv);
      if (!arr) { arr = []; compLevel2idxs.set(lv, arr); }
      arr.push(idx);
    }
    for (const [, arr] of compLevel2idxs) {
      arr.sort((a, b) => getOrigX(a, idx2sbj) - getOrigX(b, idx2sbj));
    }
    const compLevels = [...compLevel2idxs.keys()].sort((a, b) => a - b);

    const pos = new Map<number, number>(); // idx → x

    // Helper: sort and place one level
    const sortAndPlace = (lvIdxs: number[], fromNxt: boolean) => {
      const idealMap = new Map<number, number>();
      for (const idx of lvIdxs) {
        let ideal: number | null = null;
        if (fromNxt) {
          ideal = computeIdealXFromNxt(idx, idx2chain, pos, sizes);
        } else {
          ideal = computeIdealXFromPre(idx, idx2chain, pos);
        }
        idealMap.set(idx, ideal ?? pos.get(idx) ?? getOrigX(idx, idx2sbj));
      }

      const sorted = [...lvIdxs].sort((a, b) => {
        const diff = idealMap.get(a)! - idealMap.get(b)!;
        return diff !== 0 ? diff : getOrigX(a, idx2sbj) - getOrigX(b, idx2sbj);
      });

      const idealArr = sorted.map((idx) => idealMap.get(idx)!);
      placeLevel(sorted, idealArr, pos, sizes);
    };

    // Initial bottom-up placement
    for (let li = compLevels.length - 1; li >= 0; li--) {
      sortAndPlace(compLevel2idxs.get(compLevels[li])!, true);
    }

    // Barycenter iterations
    for (let iter = 0; iter < ITER; iter++) {
      // Bottom-up: pull parents over nxt house center
      for (let li = compLevels.length - 2; li >= 0; li--) {
        sortAndPlace(compLevel2idxs.get(compLevels[li])!, true);
      }
      // Top-down: pull children under pre median
      for (let li = 1; li < compLevels.length; li++) {
        sortAndPlace(compLevel2idxs.get(compLevels[li])!, false);
      }
    }

    // Final bottom-up: center each parent above its children's bounding box.
    for (let li = compLevels.length - 2; li >= 0; li--) {
      sortAndPlace(compLevel2idxs.get(compLevels[li])!, true);
    }

    // Single-chain alignment: if a node has exactly one child AND that child
    // has exactly one parent, place the child directly under the parent.
    // Propagates top-down so chains like Worksheet→Range→Multi-Range all align.
    for (let li = 0; li < compLevels.length - 1; li++) {
      for (const idx of compLevel2idxs.get(compLevels[li])!) {
        const nxt = idx2chain.get(idx)?.nxt;
        if (!nxt || nxt.size !== 1) continue;
        const [child] = nxt;
        const childPre = idx2chain.get(child)?.pre;
        if (!childPre || childPre.size !== 1) continue;
        pos.set(child, pos.get(idx)!);
      }
    }

    // Build layout with y
    const layout = new Map<number, { x: number; y: number }>();
    for (const idx of comp) {
      layout.set(idx, {
        x: pos.get(idx) ?? getOrigX(idx, idx2sbj),
        y: level2y.get(idx2level.get(idx) ?? 0) ?? 0,
      });
    }
    partitionLayouts.push({ layout, origCX });
  }

  // ── Phase 4: Arrange partitions ───────────────────────────────────────────
  partitionLayouts.sort((a, b) => a.origCX - b.origCX);

  const result = new Map<number, { x: number; y: number }>();
  let cursor = 0;
  for (let i = 0; i < partitionLayouts.length; i++) {
    const { layout } = partitionLayouts[i];
    let minX = Infinity;
    let maxX = -Infinity;
    for (const [idx, p] of layout) {
      const hw = getW(idx, sizes) / 2;
      if (p.x - hw < minX) minX = p.x - hw;
      if (p.x + hw > maxX) maxX = p.x + hw;
    }
    const leftEdge = i === 0 ? 0 : cursor + PARTITION_GAP;
    const shift = leftEdge - minX;
    for (const [idx, p] of layout) {
      result.set(idx, { x: p.x + shift, y: p.y });
    }
    cursor = maxX + shift;
  }

  // ── Phase 5: Normalize (center at origin) ─────────────────────────────────
  if (result.size > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [idx, p] of result) {
      const hw = getW(idx, sizes) / 2;
      const hh = getH(idx, sizes) / 2;
      if (p.x - hw < minX) minX = p.x - hw;
      if (p.x + hw > maxX) maxX = p.x + hw;
      if (p.y - hh < minY) minY = p.y - hh;
      if (p.y + hh > maxY) maxY = p.y + hh;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    for (const [idx, p] of result) {
      result.set(idx, { x: p.x - cx, y: p.y - cy });
    }
  }

  return result;
};
