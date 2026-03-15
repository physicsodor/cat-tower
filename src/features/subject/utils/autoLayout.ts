import {
  buildChainLevelMap,
  getPartition,
  type ChainMap,
} from "../types/Chain/chainOp";
import type { SbjMap } from "../types/Curriculum/curriculumOp";
import {
  LAYOUT_COL_GAP,
  LAYOUT_DEFAULT_H,
  LAYOUT_DEFAULT_W,
  LAYOUT_PARTITION_GAP,
  LAYOUT_ROW_GAP,
} from "../constants";

export const computeAutoLayout = (
  idx2chain: ChainMap,
  idx2sbj: SbjMap,
  sizes?: Map<number, { w: number; h: number }>,
): Map<number, { x: number; y: number }> => {
  const partition = getPartition(idx2chain);
  const idx2level = buildChainLevelMap(idx2chain, partition);
  const result = new Map<number, { x: number; y: number }>();
  if (idx2chain.size === 0) return result;

  const getW = (idx: number) => sizes?.get(idx)?.w ?? LAYOUT_DEFAULT_W;
  const getH = (idx: number) => sizes?.get(idx)?.h ?? LAYOUT_DEFAULT_H;
  const getOrigX = (idx: number) => {
    const info = idx2sbj.get(idx);
    return info?.sbjType === "SUBJECT" ? info.x : 0;
  };

  // ── per-partition layout ───────────────────────────────────────────────────
  const allPos: Map<number, { x: number; y: number }>[] = [];

  for (const comp of partition) {
    if (comp.length === 0) continue;

    // group by level
    const levelMap = new Map<number, number[]>();
    for (const idx of comp) {
      const lv = idx2level.get(idx) ?? 0;
      const arr = levelMap.get(lv);
      if (arr) arr.push(idx);
      else levelMap.set(lv, [idx]);
    }
    const levels = [...levelMap.keys()].sort((a, b) => a - b);

    // ── y: rules 1-3 ─────────────────────────────────────────────────────────
    // y[n+1] = y[n] + maxH(n)/2 + ROW_GAP + maxH(n+1)/2  (edge-to-edge = ROW_GAP)
    const levelY = new Map<number, number>();
    let cumY = 0;
    for (let i = 0; i < levels.length; i++) {
      if (i > 0) {
        const prevMaxH = Math.max(...levelMap.get(levels[i - 1])!.map(getH));
        const currMaxH = Math.max(...levelMap.get(levels[i])!.map(getH));
        cumY += prevMaxH / 2 + LAYOUT_ROW_GAP + currMaxH / 2;
      }
      levelY.set(levels[i], cumY);
    }

    // ── x: rules 4, 7, 9-14 ──────────────────────────────────────────────────
    // bottom-up: children placed before parents
    const xPos = new Map<number, number>(
      comp.map((idx) => [idx, getOrigX(idx)]),
    );

    // house center = center of bbox of nxt nodes
    const houseCenter = (idx: number): number | null => {
      const nxt = [...(idx2chain.get(idx)?.nxt ?? [])].filter((n) =>
        idx2chain.has(n),
      );
      if (nxt.length === 0) return null;
      const left = Math.min(...nxt.map((n) => xPos.get(n)! - getW(n) / 2));
      const right = Math.max(...nxt.map((n) => xPos.get(n)! + getW(n) / 2));
      return (left + right) / 2;
    };

    for (let i = levels.length - 1; i >= 0; i--) {
      const lv = levels[i];
      const nodes = levelMap.get(lv)!;

      // ideal x: house center if has children, else current x (rule 7, 9)
      const items = nodes.map((idx) => ({
        idx,
        ideal: houseCenter(idx) ?? xPos.get(idx)!,
      }));

      // sort by ideal x; preserve original x order for ties (rule 13)
      items.sort(
        (a, b) => a.ideal - b.ideal || getOrigX(a.idx) - getOrigX(b.idx),
      );

      // forward pass: enforce COL_GAP (rule 4)
      const pos = items.map((s) => s.ideal);
      for (let j = 1; j < items.length; j++) {
        const minX =
          pos[j - 1] +
          getW(items[j - 1].idx) / 2 +
          LAYOUT_COL_GAP +
          getW(items[j].idx) / 2;
        if (pos[j] < minX) pos[j] = minX;
      }

      // center actual bbox around ideal bbox center (compact, rule 14)
      if (items.length > 0) {
        const idealLeft = Math.min(...items.map((s) => s.ideal - getW(s.idx) / 2));
        const idealRight = Math.max(
          ...items.map((s) => s.ideal + getW(s.idx) / 2),
        );
        const actualLeft = pos[0] - getW(items[0].idx) / 2;
        const actualRight =
          pos[pos.length - 1] + getW(items[pos.length - 1].idx) / 2;
        const shift =
          (idealLeft + idealRight) / 2 - (actualLeft + actualRight) / 2;
        if (shift !== 0)
          for (let j = 0; j < pos.length; j++) pos[j] += shift;
      }

      for (let j = 0; j < items.length; j++) {
        xPos.set(items[j].idx, pos[j]);
      }
    }

    const pPos = new Map<number, { x: number; y: number }>();
    for (const idx of comp) {
      pPos.set(idx, {
        x: xPos.get(idx)!,
        y: levelY.get(idx2level.get(idx)!)!,
      });
    }
    allPos.push(pPos);
  }

  // ── stack partitions left-to-right with PARTITION_GAP (rule 5) ─────────────
  let rightEdge = 0;
  for (const pPos of allPos) {
    let minX = Infinity,
      maxX = -Infinity;
    for (const [idx, { x }] of pPos) {
      minX = Math.min(minX, x - getW(idx) / 2);
      maxX = Math.max(maxX, x + getW(idx) / 2);
    }
    const shift = rightEdge - minX;
    for (const [idx, pos] of pPos) {
      result.set(idx, { x: pos.x + shift, y: pos.y });
    }
    rightEdge = maxX + shift + LAYOUT_PARTITION_GAP;
  }

  // ── normalize: center bounding box at origin (rule 8) ─────────────────────
  if (result.size > 0) {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const [idx, { x, y }] of result) {
      minX = Math.min(minX, x - getW(idx) / 2);
      maxX = Math.max(maxX, x + getW(idx) / 2);
      minY = Math.min(minY, y - getH(idx) / 2);
      maxY = Math.max(maxY, y + getH(idx) / 2);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    for (const [idx, { x, y }] of result) {
      result.set(idx, { x: x - cx, y: y - cy });
    }
  }

  return result;
};
