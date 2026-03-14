import { buildChainLevelMap, type ChainMap } from "@/features/subject/types/Chain/chainOp";
import type { Curriculum, Subject } from "@/features/subject/types/Curriculum/Curriculum";
import type { FamilyMap } from "@/features/subject/types/Family/familyOp";

const REM = 16;
const ROW_GAP = 2 * REM;   // 인접 행 간 최소 간격 (edge-to-edge)
const COL_GAP = 1.5 * REM; // 인접 열 간 최소 간격 (edge-to-edge)
const DEFAULT_W = 160;
const DEFAULT_H = 48;

export function computeAutoLayout(
  list: ReadonlyArray<Curriculum>,
  idx2chain: ChainMap,
  _idx2family: FamilyMap,
  sizes?: Map<number, { w: number; h: number }>
): Map<number, { x: number; y: number }> {
  const subjects = list.filter((c): c is Subject => c.sbjType === "SUBJECT");
  if (subjects.length === 0) return new Map();

  const getW = (idx: number) => sizes?.get(idx)?.w ?? DEFAULT_W;
  const getH = (idx: number) => sizes?.get(idx)?.h ?? DEFAULT_H;

  // ── Step 1: 레벨 할당 ──────────────────────────────────────────────────────
  const idx2level = buildChainLevelMap(idx2chain);
  for (const s of subjects) {
    if (!idx2level.has(s.idx)) idx2level.set(s.idx, 0);
  }

  // ── Step 2: 레벨별 그룹화 ─────────────────────────────────────────────────
  const level2idxs = new Map<number, number[]>();
  for (const s of subjects) {
    const lv = idx2level.get(s.idx) ?? 0;
    if (!level2idxs.has(lv)) level2idxs.set(lv, []);
    level2idxs.get(lv)!.push(s.idx);
  }
  const sortedLevels = [...level2idxs.keys()].sort((a, b) => a - b);

  // ── Step 3: Y 좌표 계산 ───────────────────────────────────────────────────
  // 각 레벨의 중심 y. 레벨이 높을수록 아래 (y 증가 방향).
  const level2y = new Map<number, number>();
  for (let i = 0; i < sortedLevels.length; i++) {
    const lv = sortedLevels[i];
    const maxH = Math.max(...level2idxs.get(lv)!.map(getH));
    if (i === 0) {
      level2y.set(lv, 0);
    } else {
      const prevLv = sortedLevels[i - 1];
      const prevMaxH = Math.max(...level2idxs.get(prevLv)!.map(getH));
      level2y.set(lv, level2y.get(prevLv)! + prevMaxH / 2 + ROW_GAP + maxH / 2);
    }
  }

  // ── Step 4: X 초기값 = 현재 위치 ─────────────────────────────────────────
  const idx2x = new Map<number, number>();
  for (const s of subjects) idx2x.set(s.idx, s.x);

  // ── Step 5: Barycenter 반복 (rule 2, 3) ───────────────────────────────────
  const ITER = 10;
  for (let iter = 0; iter < ITER; iter++) {
    // Bottom-up: 노드 x = nxt 이웃의 x 중앙값 (rule 3)
    for (let i = sortedLevels.length - 2; i >= 0; i--) {
      const lv = sortedLevels[i];
      for (const idx of level2idxs.get(lv)!) {
        const nxt = idx2chain.get(idx)?.nxt;
        if (!nxt || nxt.size === 0) continue;
        const xs = [...nxt]
          .filter((n) => idx2x.has(n))
          .map((n) => idx2x.get(n)!)
          .sort((a, b) => a - b);
        if (xs.length > 0) idx2x.set(idx, median(xs));
      }
      resolveOverlaps(level2idxs.get(lv)!, idx2x, getW, COL_GAP);
    }

    // Top-down: 노드 x = pre 이웃의 x 중앙값
    for (let i = 1; i < sortedLevels.length; i++) {
      const lv = sortedLevels[i];
      for (const idx of level2idxs.get(lv)!) {
        const pre = idx2chain.get(idx)?.pre;
        if (!pre || pre.size === 0) continue;
        const xs = [...pre]
          .filter((p) => idx2x.has(p))
          .map((p) => idx2x.get(p)!)
          .sort((a, b) => a - b);
        if (xs.length > 0) idx2x.set(idx, median(xs));
      }
      resolveOverlaps(level2idxs.get(lv)!, idx2x, getW, COL_GAP);
    }
  }

  // ── Step 6: Rule 5 — 교집합 없는 nxtSet 범위가 겹치지 않도록 ──────────────
  applyDisjointNxtSets(sortedLevels, level2idxs, idx2chain, idx2x, getW, COL_GAP);

  // 최종 겹침 해소
  for (const lv of sortedLevels) {
    resolveOverlaps(level2idxs.get(lv)!, idx2x, getW, COL_GAP);
  }

  // ── Step 7: 결과 조립 ─────────────────────────────────────────────────────
  const result = new Map<number, { x: number; y: number }>();
  for (const s of subjects) {
    result.set(s.idx, {
      x: idx2x.get(s.idx) ?? s.x,
      y: level2y.get(idx2level.get(s.idx) ?? 0) ?? s.y,
    });
  }

  // ── Step 8: Normalize — 전체 바운딩 박스 중심 = (0, 0) ───────────────────
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [idx, pos] of result) {
    minX = Math.min(minX, pos.x - getW(idx) / 2);
    maxX = Math.max(maxX, pos.x + getW(idx) / 2);
    minY = Math.min(minY, pos.y - getH(idx) / 2);
    maxY = Math.max(maxY, pos.y + getH(idx) / 2);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (const [idx, pos] of result) {
    result.set(idx, { x: pos.x - cx, y: pos.y - cy });
  }

  return result;
}

/** 정렬된 배열의 중앙값 (홀수: 중간, 짝수: 아래쪽 중간) */
function median(sorted: number[]): number {
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/**
 * 같은 레벨 노드들 사이의 겹침을 해소.
 * Forward pass(오른쪽으로 밀기) → Backward pass(왼쪽으로 당기기) 후
 * 그룹 전체를 원래 중심으로 shift하여 한쪽으로 치우치지 않도록 함.
 */
function resolveOverlaps(
  idxs: number[],
  idx2x: Map<number, number>,
  getW: (idx: number) => number,
  gap: number
) {
  if (idxs.length <= 1) return;
  const sorted = [...idxs].sort((a, b) => (idx2x.get(a) ?? 0) - (idx2x.get(b) ?? 0));

  const origX = sorted.map((idx) => idx2x.get(idx) ?? 0);
  const origCenter = origX.reduce((s, x) => s + x, 0) / origX.length;

  // Forward: 겹치면 오른쪽으로 밀기
  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i - 1], c = sorted[i];
    const minX = (idx2x.get(p) ?? 0) + (getW(p) + getW(c)) / 2 + gap;
    if ((idx2x.get(c) ?? 0) < minX) idx2x.set(c, minX);
  }

  // Backward: 가능한 만큼 왼쪽으로 당기기
  for (let i = sorted.length - 2; i >= 0; i--) {
    const c = sorted[i], n = sorted[i + 1];
    const maxX = (idx2x.get(n) ?? 0) - (getW(n) + getW(c)) / 2 - gap;
    if ((idx2x.get(c) ?? 0) > maxX) idx2x.set(c, maxX);
  }

  // 그룹 중심을 원래 중심으로 복원
  const newCenter =
    sorted.reduce((s, idx) => s + (idx2x.get(idx) ?? 0), 0) / sorted.length;
  const shift = origCenter - newCenter;
  if (shift !== 0) {
    for (const idx of sorted) idx2x.set(idx, (idx2x.get(idx) ?? 0) + shift);
  }
}

/**
 * Rule 5: 같은 레벨에서 nxtSet의 교집합이 없는 두 노드 A, B에 대해
 * A.nxtSet의 x 범위와 B.nxtSet의 x 범위가 겹치지 않도록 조정.
 */
function applyDisjointNxtSets(
  levels: number[],
  level2idxs: Map<number, number[]>,
  idx2chain: ChainMap,
  idx2x: Map<number, number>,
  getW: (idx: number) => number,
  gap: number
) {
  for (const lv of levels) {
    const idxs = level2idxs.get(lv) ?? [];
    if (idxs.length < 2) continue;

    const withNxt = idxs.filter((idx) => {
      const s = idx2chain.get(idx)?.nxtSet;
      return s && s.size > 0;
    });

    for (let i = 0; i < withNxt.length; i++) {
      for (let j = i + 1; j < withNxt.length; j++) {
        const a = withNxt[i], b = withNxt[j];
        const aNxtSet = idx2chain.get(a)!.nxtSet!;
        const bNxtSet = idx2chain.get(b)!.nxtSet!;

        // 교집합 확인
        let shared = false;
        for (const n of aNxtSet) {
          if (bNxtSet.has(n)) { shared = true; break; }
        }
        if (shared) continue;

        const aRange = xRange(aNxtSet, idx2x, getW);
        const bRange = xRange(bNxtSet, idx2x, getW);
        if (!aRange || !bRange) continue;

        // 범위가 겹치면 분리
        if (aRange.max + gap > bRange.min && bRange.max + gap > aRange.min) {
          const overlap =
            Math.min(aRange.max, bRange.max) - Math.max(aRange.min, bRange.min) + gap;
          const half = overlap / 2;
          if (aRange.min <= bRange.min) {
            for (const n of aNxtSet) { const x = idx2x.get(n); if (x !== undefined) idx2x.set(n, x - half); }
            for (const n of bNxtSet) { const x = idx2x.get(n); if (x !== undefined) idx2x.set(n, x + half); }
          } else {
            for (const n of bNxtSet) { const x = idx2x.get(n); if (x !== undefined) idx2x.set(n, x - half); }
            for (const n of aNxtSet) { const x = idx2x.get(n); if (x !== undefined) idx2x.set(n, x + half); }
          }
        }
      }
    }
  }
}

/** nxtSet에 속한 노드들의 x 범위 (edge 기준) */
function xRange(
  set: ReadonlySet<number>,
  idx2x: Map<number, number>,
  getW: (idx: number) => number
): { min: number; max: number } | null {
  let min = Infinity, max = -Infinity;
  for (const n of set) {
    const x = idx2x.get(n);
    if (x === undefined) continue;
    const w = getW(n);
    min = Math.min(min, x - w / 2);
    max = Math.max(max, x + w / 2);
  }
  return min <= max ? { min, max } : null;
}
