import { buildChainLevelMap, type ChainMap } from "../types/Chain/chainOp";
import type { Curriculum, Subject } from "../types/Curriculum/Curriculum";
import type { FamilyMap } from "../types/Family/familyOp";

const REM = 16;
const GAP_ROW = 2 * REM;
const GAP_COL = 2 * REM;

export const computeAutoLayout = (
  list: ReadonlyArray<Curriculum>,
  idx2chain: ChainMap,
  _idx2family: FamilyMap,
  sizes?: Map<number, { w: number; h: number }>,
): Map<number, { x: number; y: number }> => {
  const result = new Map<number, { x: number; y: number }>();

  const subjects = list.filter((x): x is Subject => x.sbjType === "SUBJECT");
  if (subjects.length === 0) return result;

  const getSize = (idx: number) => sizes?.get(idx) ?? { w: 120, h: 40 };

  // === 1. 체인 컴포넌트: A.pre={B}, B.nxt={A} 인 쌍은 반드시 같은 열 ===
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    if (!parent.has(x)) return x;
    const root = find(parent.get(x)!);
    parent.set(x, root);
    return root;
  };
  const unite = (a: number, b: number) => {
    const ra = find(a),
      rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const s of subjects) {
    const infoA = idx2chain.get(s.idx);
    if (!infoA?.pre || infoA.pre.size !== 1) continue;
    const [bIdx] = [...infoA.pre];
    const infoB = idx2chain.get(bIdx);
    if (!infoB?.nxt || infoB.nxt.size !== 1) continue;
    if ([...infoB.nxt][0] !== s.idx) continue;
    unite(s.idx, bIdx);
  }

  const compMap = new Map<number, number[]>(); // root -> nodes
  for (const s of subjects) {
    const root = find(s.idx);
    if (!compMap.has(root)) compMap.set(root, []);
    compMap.get(root)!.push(s.idx);
  }

  // === 2. 행(level) 할당 ===
  const levelMap = buildChainLevelMap(idx2chain);
  const levelGroups = new Map<number, number[]>();
  for (const s of subjects) {
    const level = levelMap.get(s.idx) ?? 0;
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(s.idx);
  }
  const sortedLevels = [...levelGroups.keys()].sort((a, b) => a - b);

  // === 3. Barycenter heuristic으로 각 행 내 노드 순서 결정 ===
  const subjectX = new Map(subjects.map((s) => [s.idx, s.x]));
  for (const level of sortedLevels) {
    levelGroups
      .get(level)!
      .sort((a, b) => (subjectX.get(a) ?? 0) - (subjectX.get(b) ?? 0));
  }

  const computeBarycenters = (
    group: number[],
    neighborLevel: number,
  ): Map<number, number> => {
    const neighborGroup = levelGroups.get(neighborLevel);
    const neighborPos = new Map(neighborGroup?.map((idx, i) => [idx, i]) ?? []);
    const barycenters = new Map<number, number>();
    for (let i = 0; i < group.length; i++) {
      const idx = group[i];
      const info = idx2chain.get(idx);
      const neighbors: number[] = [];
      if (info?.pre)
        for (const pIdx of info.pre)
          if (neighborPos.has(pIdx)) neighbors.push(pIdx);
      if (info?.nxt)
        for (const nIdx of info.nxt)
          if (neighborPos.has(nIdx)) neighbors.push(nIdx);
      if (neighbors.length === 0) {
        barycenters.set(idx, i);
      } else {
        const sum = neighbors.reduce(
          (acc, nIdx) => acc + (neighborPos.get(nIdx) ?? 0),
          0,
        );
        barycenters.set(idx, sum / neighbors.length);
      }
    }
    return barycenters;
  };

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < sortedLevels.length; i++) {
      const group = levelGroups.get(sortedLevels[i])!;
      const bc = computeBarycenters(group, sortedLevels[i - 1]);
      group.sort((a, b) => (bc.get(a) ?? 0) - (bc.get(b) ?? 0));
    }
    for (let i = sortedLevels.length - 2; i >= 0; i--) {
      const group = levelGroups.get(sortedLevels[i])!;
      const bc = computeBarycenters(group, sortedLevels[i + 1]);
      group.sort((a, b) => (bc.get(a) ?? 0) - (bc.get(b) ?? 0));
    }
  }

  // === 4. 컴포넌트 순서 결정: 각 행 내 정규화된 rank의 평균 ===
  const nodeNormRank = new Map<number, number>();
  for (const level of sortedLevels) {
    const group = levelGroups.get(level)!;
    const n = group.length;
    for (let i = 0; i < n; i++) {
      nodeNormRank.set(group[i], n > 1 ? i / (n - 1) : 0);
    }
  }

  const compScore = new Map<number, number>();
  for (const [root, nodes] of compMap) {
    const avg =
      nodes.reduce((sum, idx) => sum + (nodeNormRank.get(idx) ?? 0), 0) /
      nodes.length;
    compScore.set(root, avg);
  }

  const sortedComps = [...compMap.entries()].sort(
    ([ra], [rb]) => (compScore.get(ra) ?? 0) - (compScore.get(rb) ?? 0),
  );

  // === 5. Leftmost fit 열 배정 ===
  // 조건: 레벨 비충돌 AND 열 내 기존 노드와 pre/nxt 연결이 있을 것
  const colOccupied: Set<number>[] = []; // 열 i에 배치된 레벨 집합
  const colNodes: Set<number>[] = []; // 열 i에 배치된 노드 집합
  const compToCol = new Map<number, number>(); // root -> 열 인덱스

  for (const [root, nodes] of sortedComps) {
    const compLevels = new Set(nodes.map((idx) => levelMap.get(idx) ?? 0));

    let assigned = -1;
    for (let ci = 0; ci < colOccupied.length; ci++) {
      if ([...compLevels].some((lv) => colOccupied[ci].has(lv))) continue;
      const connected = nodes.some((idx) => {
        const info = idx2chain.get(idx);
        if (info?.preSet)
          for (const p of info.preSet) if (colNodes[ci].has(p)) return true;
        if (info?.nxtSet)
          for (const n of info.nxtSet) if (colNodes[ci].has(n)) return true;
        return false;
      });
      if (connected) {
        assigned = ci;
        break;
      }
    }
    if (assigned === -1) {
      assigned = colOccupied.length;
      colOccupied.push(new Set());
      colNodes.push(new Set());
    }
    for (const lv of compLevels) colOccupied[assigned].add(lv);
    for (const idx of nodes) colNodes[assigned].add(idx);
    compToCol.set(root, assigned);
  }

  const numCols = colOccupied.length;
  const idxToCol = new Map<number, number>();
  for (const s of subjects) idxToCol.set(s.idx, compToCol.get(find(s.idx))!);

  // === 6. 열 너비 = 해당 열 내 최대 노드 너비 ===
  const colWidth = new Map<number, number>();
  for (let i = 0; i < numCols; i++) colWidth.set(i, 0);
  for (const s of subjects) {
    const ci = idxToCol.get(s.idx)!;
    colWidth.set(ci, Math.max(colWidth.get(ci)!, getSize(s.idx).w));
  }

  // === 7. 열 x 위치 계산 (GAP_COL 간격, x=0 중심) ===
  const totalWidth =
    [...colWidth.values()].reduce((a, b) => a + b, 0) + GAP_COL * (numCols - 1);
  const colX = new Map<number, number>();
  let xPos = -totalWidth / 2;
  for (let i = 0; i < numCols; i++) {
    const w = colWidth.get(i)!;
    colX.set(i, xPos + w / 2);
    xPos += w + GAP_COL;
  }

  // === 8. 행 y 위치 계산 ===
  const levelY = new Map<number, number>();
  let currentY = 0;
  for (let i = 0; i < sortedLevels.length; i++) {
    const level = sortedLevels[i];
    const group = levelGroups.get(level)!;
    const rowH = Math.max(...group.map((idx) => getSize(idx).h));
    if (i === 0) {
      currentY = rowH / 2;
    } else {
      const prevGroup = levelGroups.get(sortedLevels[i - 1])!;
      const prevRowH = Math.max(...prevGroup.map((idx) => getSize(idx).h));
      currentY += prevRowH / 2 + GAP_ROW + rowH / 2;
    }
    levelY.set(level, currentY);
  }

  // === 9. 위치 할당 ===
  for (const s of subjects) {
    result.set(s.idx, {
      x: colX.get(idxToCol.get(s.idx)!)!,
      y: levelY.get(levelMap.get(s.idx) ?? 0)!,
    });
  }

  // === 10. 전체 바운딩 박스 중앙을 원점으로 이동 ===
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const s of subjects) {
    const pos = result.get(s.idx)!;
    const size = getSize(s.idx);
    minX = Math.min(minX, pos.x - size.w / 2);
    maxX = Math.max(maxX, pos.x + size.w / 2);
    minY = Math.min(minY, pos.y - size.h / 2);
    maxY = Math.max(maxY, pos.y + size.h / 2);
  }
  const shiftX = (minX + maxX) / 2;
  const shiftY = (minY + maxY) / 2;
  for (const s of subjects) {
    const pos = result.get(s.idx)!;
    result.set(s.idx, { x: pos.x - shiftX, y: pos.y - shiftY });
  }

  return result;
};
