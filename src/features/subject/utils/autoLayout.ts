import { buildChainLevelMap, type ChainMap } from "../types/Chain/chainOp";
import type { Curriculum, Subject } from "../types/Curriculum/Curriculum";
import type { FamilyMap } from "../types/Family/familyOp";

const REM = 16;
const GAP_ROW = 2 * REM;
const GAP_COL = 2 * REM;

const makeUF = () => {
  const par = new Map<number, number>();
  const find = (x: number): number => {
    if (!par.has(x)) return x;
    const r = find(par.get(x)!);
    par.set(x, r);
    return r;
  };
  const unite = (a: number, b: number) => {
    const ra = find(a),
      rb = find(b);
    if (ra !== rb) par.set(ra, rb);
  };
  return { find, unite };
};

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

  // === 1. 파티션: pre/nxt 약연결 컴포넌트 ===
  // 같은 파티션 내 노드들만 열을 공유할 수 있다.
  const partUF = makeUF();
  for (const s of subjects) {
    const info = idx2chain.get(s.idx);
    if (info?.pre) for (const p of info.pre) partUF.unite(s.idx, p);
    if (info?.nxt) for (const n of info.nxt) partUF.unite(s.idx, n);
  }

  const partitionMap = new Map<number, number[]>(); // partRoot -> nodes
  for (const s of subjects) {
    const r = partUF.find(s.idx);
    if (!partitionMap.has(r)) partitionMap.set(r, []);
    partitionMap.get(r)!.push(s.idx);
  }

  // === 2. 체인 컴포넌트: A.pre={B}, B.nxt={A} 인 쌍은 같은 열 ===
  const chainUF = makeUF();
  for (const s of subjects) {
    const infoA = idx2chain.get(s.idx);
    if (!infoA?.pre || infoA.pre.size !== 1) continue;
    const [bIdx] = [...infoA.pre];
    const infoB = idx2chain.get(bIdx);
    if (!infoB?.nxt || infoB.nxt.size !== 1) continue;
    if ([...infoB.nxt][0] !== s.idx) continue;
    chainUF.unite(s.idx, bIdx);
  }

  const chainCompMap = new Map<number, number[]>(); // chainRoot -> nodes
  for (const s of subjects) {
    const r = chainUF.find(s.idx);
    if (!chainCompMap.has(r)) chainCompMap.set(r, []);
    chainCompMap.get(r)!.push(s.idx);
  }

  // === 3. 행(level) 할당 ===
  const levelMap = buildChainLevelMap(idx2chain);
  const levelGroups = new Map<number, number[]>();
  for (const s of subjects) {
    const level = levelMap.get(s.idx) ?? 0;
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(s.idx);
  }
  const sortedLevels = [...levelGroups.keys()].sort((a, b) => a - b);

  // === 4. Barycenter heuristic ===
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
        for (const p of info.pre)
          if (neighborPos.has(p)) neighbors.push(p);
      if (info?.nxt)
        for (const n of info.nxt)
          if (neighborPos.has(n)) neighbors.push(n);
      barycenters.set(
        idx,
        neighbors.length === 0
          ? i
          : neighbors.reduce((s, n) => s + neighborPos.get(n)!, 0) /
              neighbors.length,
      );
    }
    return barycenters;
  };

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < sortedLevels.length; i++) {
      const g = levelGroups.get(sortedLevels[i])!;
      const bc = computeBarycenters(g, sortedLevels[i - 1]);
      g.sort((a, b) => bc.get(a)! - bc.get(b)!);
    }
    for (let i = sortedLevels.length - 2; i >= 0; i--) {
      const g = levelGroups.get(sortedLevels[i])!;
      const bc = computeBarycenters(g, sortedLevels[i + 1]);
      g.sort((a, b) => bc.get(a)! - bc.get(b)!);
    }
  }

  // === 5. 체인 컴포넌트 점수 (정규화 rank 평균) ===
  const nodeNormRank = new Map<number, number>();
  for (const level of sortedLevels) {
    const g = levelGroups.get(level)!;
    const n = g.length;
    for (let i = 0; i < n; i++) nodeNormRank.set(g[i], n > 1 ? i / (n - 1) : 0);
  }

  const chainCompScore = new Map<number, number>();
  for (const [root, nodes] of chainCompMap) {
    chainCompScore.set(
      root,
      nodes.reduce((s, idx) => s + (nodeNormRank.get(idx) ?? 0), 0) /
        nodes.length,
    );
  }

  // === 6. 파티션별 leftmost fit 열 배정 ===
  // 파티션 내 레벨 비충돌이면 같은 열 허용, 파티션 간 열 공유 없음.
  const chainCompToLocalCol = new Map<number, number>();

  // 파티션 순서: 해당 파티션 체인 컴포넌트 점수 평균
  const partScore = new Map<number, number>();
  for (const [partRoot, partNodes] of partitionMap) {
    const roots = [...new Set(partNodes.map((idx) => chainUF.find(idx)))];
    partScore.set(
      partRoot,
      roots.reduce((s, r) => s + (chainCompScore.get(r) ?? 0), 0) /
        roots.length,
    );
  }
  const sortedPartRoots = [...partitionMap.keys()].sort(
    (a, b) => (partScore.get(a) ?? 0) - (partScore.get(b) ?? 0),
  );

  const partColOffset = new Map<number, number>();
  let globalColOffset = 0;

  for (const partRoot of sortedPartRoots) {
    const partNodes = partitionMap.get(partRoot)!;
    const sortedComps = [
      ...new Set(partNodes.map((idx) => chainUF.find(idx))),
    ].sort((a, b) => (chainCompScore.get(a) ?? 0) - (chainCompScore.get(b) ?? 0));

    const colOccupied: Set<number>[] = [];

    // Leftmost fit
    for (const root of sortedComps) {
      const nodes = chainCompMap.get(root)!;
      const compLevels = new Set(nodes.map((idx) => levelMap.get(idx) ?? 0));

      let assigned = -1;
      for (let ci = 0; ci < colOccupied.length; ci++) {
        if (![...compLevels].some((lv) => colOccupied[ci].has(lv))) {
          assigned = ci;
          break;
        }
      }
      if (assigned === -1) {
        assigned = colOccupied.length;
        colOccupied.push(new Set());
      }
      for (const lv of compLevels) colOccupied[assigned].add(lv);
      chainCompToLocalCol.set(root, assigned);
    }

    // Nxt-alignment pass: best-effort move each component to a nxt node's column.
    // Process highest-level components first so nxt columns are already settled.
    const realignOrder = [...sortedComps].sort((a, b) => {
      const maxA = Math.max(...chainCompMap.get(a)!.map((idx) => levelMap.get(idx) ?? 0));
      const maxB = Math.max(...chainCompMap.get(b)!.map((idx) => levelMap.get(idx) ?? 0));
      return maxB - maxA;
    });

    for (const root of realignOrder) {
      const nodes = chainCompMap.get(root)!;

      // Collect unique local columns of all nxt nodes in this partition
      const nxtColSet = new Set<number>();
      for (const idx of nodes) {
        const info = idx2chain.get(idx);
        if (!info?.nxt) continue;
        for (const nIdx of info.nxt) {
          if (partUF.find(nIdx) !== partRoot) continue;
          const nLocalCol = chainCompToLocalCol.get(chainUF.find(nIdx));
          if (nLocalCol !== undefined) nxtColSet.add(nLocalCol);
        }
      }
      if (nxtColSet.size === 0) continue;

      const curCol = chainCompToLocalCol.get(root)!;
      const compLevels = new Set(nodes.map((idx) => levelMap.get(idx) ?? 0));

      // Median of nxt columns (left median if even count)
      const nxtCols = [...nxtColSet].sort((a, b) => a - b);
      const median = nxtCols[Math.floor((nxtCols.length - 1) / 2)];

      // Temporarily remove component from its current column for conflict check
      for (const lv of compLevels) colOccupied[curCol].delete(lv);

      // Feasible nxt columns: no level conflict at that column
      const feasible = nxtCols.filter((col) =>
        col >= colOccupied.length ||
        ![...compLevels].some((lv) => colOccupied[col].has(lv)),
      );

      if (feasible.length === 0) {
        for (const lv of compLevels) colOccupied[curCol].add(lv);
        continue;
      }

      // Pick feasible col closest to median (left/smaller on tie)
      const bestCol = feasible.reduce((best, col) => {
        const db = Math.abs(best - median);
        const dc = Math.abs(col - median);
        return dc < db || (dc === db && col < best) ? col : best;
      });

      if (bestCol === curCol) {
        for (const lv of compLevels) colOccupied[curCol].add(lv);
        continue;
      }

      while (colOccupied.length <= bestCol) colOccupied.push(new Set());
      for (const lv of compLevels) colOccupied[bestCol].add(lv);
      chainCompToLocalCol.set(root, bestCol);
    }

    // Compact: remap local column indices to 0, 1, 2, ... (no gaps)
    const usedCols = [
      ...new Set(sortedComps.map((r) => chainCompToLocalCol.get(r)!)),
    ].sort((a, b) => a - b);
    const colRemap = new Map(usedCols.map((col, i) => [col, i]));
    for (const root of sortedComps) {
      chainCompToLocalCol.set(root, colRemap.get(chainCompToLocalCol.get(root)!)!);
    }

    partColOffset.set(partRoot, globalColOffset);
    globalColOffset += usedCols.length;
  }

  const numCols = globalColOffset;
  const idxToGlobalCol = new Map<number, number>();
  for (const s of subjects) {
    idxToGlobalCol.set(
      s.idx,
      partColOffset.get(partUF.find(s.idx))! +
        chainCompToLocalCol.get(chainUF.find(s.idx))!,
    );
  }

  // === 7. 열 너비 = 해당 열 내 최대 노드 너비 ===
  const colWidth = new Map<number, number>();
  for (let i = 0; i < numCols; i++) colWidth.set(i, 0);
  for (const s of subjects) {
    const ci = idxToGlobalCol.get(s.idx)!;
    colWidth.set(ci, Math.max(colWidth.get(ci)!, getSize(s.idx).w));
  }

  // === 8. 열 x 위치 계산 (GAP_COL 간격, x=0 중심) ===
  const totalWidth =
    [...colWidth.values()].reduce((a, b) => a + b, 0) +
    GAP_COL * (numCols - 1);
  const colX = new Map<number, number>();
  let xPos = -totalWidth / 2;
  for (let i = 0; i < numCols; i++) {
    const w = colWidth.get(i)!;
    colX.set(i, xPos + w / 2);
    xPos += w + GAP_COL;
  }

  // === 9. 행 y 위치 계산 ===
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

  // === 10. 위치 할당 ===
  for (const s of subjects) {
    result.set(s.idx, {
      x: colX.get(idxToGlobalCol.get(s.idx)!)!,
      y: levelY.get(levelMap.get(s.idx) ?? 0)!,
    });
  }

  // === 11. 전체 바운딩 박스 중앙을 원점으로 이동 ===
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
