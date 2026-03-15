import { buildChainLevelMap, type ChainMap } from "@/features/subject/types/Chain/chainOp";
import type { Curriculum, Subject } from "@/features/subject/types/Curriculum/Curriculum";
import type { FamilyMap } from "@/features/subject/types/Family/familyOp";
import {
  LAYOUT_ROW_GAP as ROW_GAP,
  LAYOUT_COL_GAP as COL_GAP,
  LAYOUT_DEFAULT_W as DEFAULT_W,
  LAYOUT_DEFAULT_H as DEFAULT_H,
  LAYOUT_ITER as ITER,
  LAYOUT_PARTITION_GAP as PARTITION_GAP,
} from "@/features/subject/constants";

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

  // ── Step 2: Weakly connected components 탐색 ──────────────────────────────
  const components = findComponents(subjects, idx2chain);

  // ── Step 3: 각 component를 독립적으로 integer column 배치 ─────────────────
  const pixelLayouts: Map<number, { x: number; y: number }>[] = [];
  for (const compIdxs of components) {
    const colLayout = layoutComponent(compIdxs, idx2chain, idx2level, getW, getH);
    const pixelLayout = colToX(colLayout, getW);
    pixelLayouts.push(pixelLayout);
  }

  // ── Step 4: Component들을 x축으로 나란히 배치 (min idx 기준 정렬) ─────────
  const result = arrangeComponents(pixelLayouts, getW);

  // ── Step 5: Normalize — 전체 바운딩 박스 중심 = (0, 0) ───────────────────
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

/** BFS로 weakly connected components 탐색. subjects에 속한 노드만 포함. */
function findComponents(subjects: Subject[], idx2chain: ChainMap): number[][] {
  const subjectSet = new Set(subjects.map((s) => s.idx));
  const visited = new Set<number>();
  const components: number[][] = [];

  for (const s of subjects) {
    if (visited.has(s.idx)) continue;
    const component: number[] = [];
    const q = [s.idx];
    visited.add(s.idx);
    while (q.length > 0) {
      const v = q.shift()!;
      component.push(v);
      const chain = idx2chain.get(v);
      for (const nb of [...(chain?.pre ?? []), ...(chain?.nxt ?? [])]) {
        if (subjectSet.has(nb) && !visited.has(nb)) {
          visited.add(nb);
          q.push(nb);
        }
      }
    }
    components.push(component);
  }

  return components;
}

/**
 * Component 하나를 integer column + y로 배치.
 * 반환값: Map<idx, { col: integer, y: pixel }>
 */
function layoutComponent(
  idxs: number[],
  idx2chain: ChainMap,
  idx2level: Map<number, number>,
  _getW: (idx: number) => number,
  getH: (idx: number) => number
): Map<number, { col: number; y: number }> {
  // 레벨별 그룹화
  const level2idxs = new Map<number, number[]>();
  for (const idx of idxs) {
    const lv = idx2level.get(idx) ?? 0;
    if (!level2idxs.has(lv)) level2idxs.set(lv, []);
    level2idxs.get(lv)!.push(idx);
  }
  const sortedLevels = [...level2idxs.keys()].sort((a, b) => a - b);

  // Y 좌표 계산
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

  // ── 초기 col 할당: 상위→하위 재귀 서브트리 배치 ─────────────────────────────
  const idx2col = new Map<number, number>();
  const compSet = new Set(idxs);

  // 루트 노드 탐색 (컴포넌트 내에 pre가 없는 노드)
  const roots = idxs
    .filter(idx => ![...(idx2chain.get(idx)?.pre ?? [])].some(p => compSet.has(p)))
    .sort((a, b) => a - b);

  // BFS spanning tree 구성 (DAG 공유 자식 처리: 각 노드는 최초 방문 부모의 자식으로만 등록)
  const spanChildren = new Map<number, number[]>(idxs.map(idx => [idx, []]));
  const bfsVisited = new Set(roots);
  const bfsQueue = [...roots];
  while (bfsQueue.length > 0) {
    const node = bfsQueue.shift()!;
    for (const child of [...(idx2chain.get(node)?.nxt ?? [])]
      .filter(n => compSet.has(n))
      .sort((a, b) => a - b)) {
      if (!bfsVisited.has(child)) {
        bfsVisited.add(child);
        spanChildren.get(node)!.push(child);
        bfsQueue.push(child);
      }
    }
  }

  // 서브트리 너비 계산 (leaf = 1, internal node = 자식 너비의 합)
  const subtreeW = new Map<number, number>();
  function calcWidth(idx: number): number {
    const ch = spanChildren.get(idx)!;
    const w = ch.length === 0 ? 1 : ch.reduce((s, c) => s + calcWidth(c), 0);
    subtreeW.set(idx, w);
    return w;
  }
  for (const r of roots) calcWidth(r);

  // 하향식 col 배정: 각 노드는 자신에게 할당된 범위의 중앙(floor)에 배치
  function assignCols(idx: number, start: number): void {
    const w = subtreeW.get(idx)!;
    idx2col.set(idx, start + Math.floor((w - 1) / 2));
    let childCursor = start;
    for (const child of spanChildren.get(idx)!) {
      assignCols(child, childCursor);
      childCursor += subtreeW.get(child)!;
    }
  }
  let colCursor = 0;
  for (const r of roots) {
    assignCols(r, colCursor);
    colCursor += subtreeW.get(r)!;
  }

  // 각 레벨에서 overlap 해소 (초기 배치 안정화)
  for (const lv of sortedLevels) {
    resolveColOverlaps(level2idxs.get(lv)!, idx2col);
  }

  // ── Integer-column barycenter 반복 ────────────────────────────────────────
  for (let iter = 0; iter < ITER; iter++) {
    // Bottom-up: nxt가 있는 노드만 — col = lower median of nxt cols
    for (let i = sortedLevels.length - 2; i >= 0; i--) {
      const lv = sortedLevels[i];
      for (const idx of level2idxs.get(lv)!) {
        const nxtCols = [...(idx2chain.get(idx)?.nxt ?? [])]
          .filter((n) => idx2col.has(n))
          .map((n) => idx2col.get(n)!)
          .sort((a, b) => a - b);
        if (nxtCols.length > 0) idx2col.set(idx, median(nxtCols));
      }
      resolveColOverlaps(level2idxs.get(lv)!, idx2col);
    }

    // Top-down: nxt가 없는 노드만 (leaf) — col = lower median of pre cols
    for (let i = 1; i < sortedLevels.length; i++) {
      const lv = sortedLevels[i];
      for (const idx of level2idxs.get(lv)!) {
        const nxtInComp = [...(idx2chain.get(idx)?.nxt ?? [])].filter((n) =>
          idx2col.has(n)
        );
        if (nxtInComp.length > 0) continue; // nxt 있으면 bottom-up 결과 유지
        const preCols = [...(idx2chain.get(idx)?.pre ?? [])]
          .filter((p) => idx2col.has(p))
          .map((p) => idx2col.get(p)!)
          .sort((a, b) => a - b);
        if (preCols.length > 0) idx2col.set(idx, median(preCols));
      }
      resolveColOverlaps(level2idxs.get(lv)!, idx2col);
    }
  }

  // Normalize: min col → 0
  const minCol = Math.min(...[...idx2col.values()]);
  for (const [idx, col] of idx2col) idx2col.set(idx, col - minCol);

  // 결과 조립
  const result = new Map<number, { col: number; y: number }>();
  for (const idx of idxs) {
    result.set(idx, {
      col: idx2col.get(idx)!,
      y: level2y.get(idx2level.get(idx) ?? 0)!,
    });
  }
  return result;
}

/** Integer column 겹침 해소: forward push → backward compact → center restore */
function resolveColOverlaps(idxs: number[], idx2col: Map<number, number>): void {
  if (idxs.length <= 1) return;
  const sorted = [...idxs].sort((a, b) => (idx2col.get(a) ?? 0) - (idx2col.get(b) ?? 0));
  const origCenter = sorted.reduce((s, idx) => s + (idx2col.get(idx) ?? 0), 0) / sorted.length;

  // Forward: col[i] >= col[i-1] + 1
  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i - 1], c = sorted[i];
    const minCol = idx2col.get(p)! + 1;
    if (idx2col.get(c)! < minCol) idx2col.set(c, minCol);
  }

  // Backward: compact left
  for (let i = sorted.length - 2; i >= 0; i--) {
    const c = sorted[i], n = sorted[i + 1];
    const maxCol = idx2col.get(n)! - 1;
    if (idx2col.get(c)! > maxCol) idx2col.set(c, maxCol);
  }

  // Center restore
  const newCenter = sorted.reduce((s, idx) => s + (idx2col.get(idx) ?? 0), 0) / sorted.length;
  const shift = Math.round(origCenter - newCenter);
  if (shift !== 0) {
    for (const idx of sorted) idx2col.set(idx, idx2col.get(idx)! + shift);
  }
}

/** column index → pixel x 변환. variable-width 노드 지원. */
function colToX(
  layout: Map<number, { col: number; y: number }>,
  getW: (idx: number) => number
): Map<number, { x: number; y: number }> {
  if (layout.size === 0) return new Map();

  const maxCol = Math.max(...[...layout.values()].map((v) => v.col));

  // 각 column의 최대 width 계산
  const colMaxW = new Array<number>(maxCol + 1).fill(0);
  for (const [idx, { col }] of layout) {
    colMaxW[col] = Math.max(colMaxW[col], getW(idx));
  }
  // 폭이 0인 column은 DEFAULT_W로 채움 (빈 column 방어)
  for (let c = 0; c <= maxCol; c++) {
    if (colMaxW[c] === 0) colMaxW[c] = DEFAULT_W;
  }

  // 각 column의 center x 계산 (edge-to-edge COL_GAP 유지)
  const colCenterX = new Array<number>(maxCol + 1);
  colCenterX[0] = colMaxW[0] / 2;
  for (let c = 1; c <= maxCol; c++) {
    colCenterX[c] = colCenterX[c - 1] + colMaxW[c - 1] / 2 + COL_GAP + colMaxW[c] / 2;
  }

  const result = new Map<number, { x: number; y: number }>();
  for (const [idx, { col, y }] of layout) {
    result.set(idx, { x: colCenterX[col], y });
  }
  return result;
}

/**
 * Component pixel layout들을 x축으로 나란히 배치.
 * min idx 기준으로 정렬하여 deterministic 순서 보장.
 */
function arrangeComponents(
  pixelLayouts: Map<number, { x: number; y: number }>[],
  getW: (idx: number) => number
): Map<number, { x: number; y: number }> {
  const result = new Map<number, { x: number; y: number }>();
  if (pixelLayouts.length === 0) return result;

  // min idx로 component 정렬
  const sorted = [...pixelLayouts].sort((a, b) => {
    const minA = Math.min(...a.keys());
    const minB = Math.min(...b.keys());
    return minA - minB;
  });

  let cursor = 0; // 이전 component의 right edge
  for (let i = 0; i < sorted.length; i++) {
    const layout = sorted[i];
    let minX = Infinity, maxX = -Infinity;
    for (const [idx, pos] of layout) {
      minX = Math.min(minX, pos.x - getW(idx) / 2);
      maxX = Math.max(maxX, pos.x + getW(idx) / 2);
    }
    const leftEdge = i === 0 ? 0 : cursor + PARTITION_GAP;
    const shift = leftEdge - minX;
    for (const [idx, pos] of layout) {
      result.set(idx, { x: pos.x + shift, y: pos.y });
    }
    cursor = maxX + shift;
  }

  return result;
}

/** 정렬된 배열의 하위 중앙값 (짝수: 아래쪽 중간) */
function median(sorted: number[]): number {
  return sorted[Math.floor((sorted.length - 1) / 2)];
}
