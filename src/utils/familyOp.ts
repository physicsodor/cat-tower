import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import type { Family } from "../types/Family";
import type { InsertMode } from "../types/InsertMode";
import { modifyItems } from "./idxItemOp";

type NewInfo = Partial<Family>;

const getNewBro = <T extends Family>(
  list: ReadonlyArray<T>,
  mom: number
): string => {
  let lastBro: string | null = "";
  for (const t of list) if (t.mom === mom && t.bro > lastBro) lastBro = t.bro;
  if (lastBro === "") lastBro = null;
  return generateKeyBetween(lastBro, null);
};

type FamilyMap<T extends Family> = {
  idx2item: ReadonlyMap<number, T>;
  mom2idxs: ReadonlyMap<number, number[]>;
};

const _compare =
  <T extends Family>(idx2item: ReadonlyMap<number, T>) =>
  (a: number, b: number) => {
    const broA = idx2item.get(a)?.bro ?? "";
    const broB = idx2item.get(b)?.bro ?? "";
    return broA === broB ? 0 : broA < broB ? -1 : 1;
  };

export const makeFamilyMap = <T extends Family>(
  TList: ReadonlyArray<T>
): FamilyMap<T> => {
  const idx2item = new Map<number, T>();
  const mom2idxs = new Map<number, number[]>();

  for (const t of TList) {
    idx2item.set(t.idx, t);
    const arr = mom2idxs.get(t.mom);
    if (arr) arr.push(t.idx);
    else mom2idxs.set(t.mom, [t.idx]);
  }
  for (const arr of mom2idxs.values()) arr.sort(_compare(idx2item));

  return { idx2item, mom2idxs };
};

const makeMom2Idxs = <T extends Family>(
  idx2item: ReadonlyMap<number, T>
): Map<number, number[]> => {
  const mom2idxs = new Map<number, number[]>();
  for (const t of idx2item.values()) {
    const arr = mom2idxs.get(t.mom);
    if (arr) arr.push(t.idx);
    else mom2idxs.set(t.mom, [t.idx]);
  }
  return mom2idxs;
};

const makeIdx2NewBro = (
  idxList: number[],
  leftBro: string | null,
  rightBro: string | null
): Map<number, string> => {
  const n = idxList.length;
  if (n === 0) return new Map();
  const bros = generateNKeysBetween(leftBro, rightBro, n);
  const idx2newBro = new Map<number, string>();
  for (let i = 0; i < n; i++) idx2newBro.set(idxList[i], bros[i]);
  return idx2newBro;
};

const getAdjacentBro = <T extends Family>(
  idx2item: ReadonlyMap<number, T>,
  mom2idxs: ReadonlyMap<number, number[]>,
  pivotIdx: number,
  ignore: ReadonlySet<number> = new Set()
): { leftBro: string | null; rightBro: string | null } => {
  const result = { leftBro: null, rightBro: null };
  const pivot = idx2item.get(pivotIdx);
  if (!pivot) return result;
  const broIdxs = mom2idxs.get(pivot.mom);
  if (!broIdxs) return result;
  const ord = broIdxs.indexOf(pivotIdx);
  if (ord < 0) return result;

  let leftBro: string | null = null;
  for (let i = ord - 1; i >= 0; i--) {
    const idx = broIdxs[i];
    if (!ignore.has(idx)) {
      leftBro = idx2item.get(idx)?.bro ?? null;
      break;
    }
  }

  let rightBro: string | null = null;
  for (let i = ord + 1; i < broIdxs.length; i++) {
    const idx = broIdxs[i];
    if (!ignore.has(idx)) {
      rightBro = idx2item.get(idx)?.bro ?? null;
      break;
    }
  }
  return { leftBro, rightBro };
};

const isMomCyclic = <T extends Family>(
  idx2item: ReadonlyMap<number, T>,
  idx: number,
  targetSet: ReadonlySet<number>
) => {
  let testMom = idx;
  const visited = new Set<number>(targetSet);
  while (testMom >= 0) {
    if (visited.has(testMom)) return true;
    testMom = idx2item.get(testMom)?.mom ?? -1;
  }
  return false;
};

const getFlatIdxs = (
  mom2idxs: ReadonlyMap<number, number[]>,
  idxSet: ReadonlySet<number>,
  mode: "TARGET" | "IGNORE",
  mom: number = -1
): number[] => {
  const newMom = mode === "TARGET" ? -1 : mom;
  const result: number[] = [];
  const visited = new Set<number>();
  const pushIdx = (m: number) => {
    const idxs = mom2idxs.get(m) ?? [];
    for (const idx of idxs) {
      if (visited.has(idx)) continue;
      visited.add(idx);
      if ((mode === "TARGET") === idxSet.has(idx)) result.push(idx);
      if (mode === "TARGET" || idxSet.has(idx)) pushIdx(idx);
    }
  };
  pushIdx(newMom);
  return result;
};

const deleteFamilyMap = <T extends Family>(
  idx2item: ReadonlyMap<number, T>,
  targetSet: ReadonlySet<number>
): Map<number, NewInfo> => {
  if (targetSet.size === 0) return new Map();
  const mom2idxs = makeMom2Idxs(idx2item);

  const topIdxs: number[] = [];
  for (const idx of targetSet) {
    const mom = idx2item.get(idx)?.mom;
    if (mom === undefined) continue;
    if (!targetSet.has(mom)) topIdxs.push(idx);
  }
  if (topIdxs.length === 0) return new Map();

  type Run = { rightBro: string | null; idxs: number[] };
  type Runs = Map<string | null, Run>;
  const mom2runs = new Map<number, Runs>();
  for (const topIdx of topIdxs) {
    const top = idx2item.get(topIdx);
    if (!top) continue;

    const idxs = getFlatIdxs(mom2idxs, targetSet, "IGNORE", topIdx);
    if (idxs.length === 0) continue;
    const { leftBro, rightBro } = getAdjacentBro(
      idx2item,
      mom2idxs,
      topIdx,
      targetSet
    );
    const runs: Runs = mom2runs.get(top.mom) ?? new Map();
    const run: Run = runs.get(leftBro) ?? { rightBro, idxs: [] };
    run.idxs.push(...idxs);
    runs.set(leftBro, run);
    mom2runs.set(top.mom, runs);
  }

  const idx2new = new Map<number, NewInfo>();
  for (const [mom, runs] of mom2runs) {
    for (const [leftBro, run] of runs) {
      const m = makeIdx2NewBro(run.idxs, leftBro, run.rightBro);
      for (const [idx, bro] of m) {
        const t = idx2item.get(idx);
        if (!t) continue;
        const newInfo: NewInfo = {};
        if (t.mom !== mom) newInfo.mom = mom;
        if (t.bro !== bro) newInfo.bro = bro;
        if (!newInfo.mom || !newInfo.bro) idx2new.set(idx, newInfo);
      }
    }
  }

  return idx2new;
};

const setBro = <T extends Family>(
  list: ReadonlyArray<T>,
  targetSet: ReadonlySet<number>,
  pivotIdx: number,
  dir: InsertMode
): T[] => {
  const familyMap = makeFamilyMap(list);
  const { idx2item, mom2idxs } = familyMap;

  const pivot = idx2item.get(pivotIdx);
  if (!pivot || targetSet.has(pivotIdx)) return list as T[];

  const newMom = pivot.mom;
  if (isMomCyclic(idx2item, newMom, targetSet)) return list as T[];

  const adjacentBro = getAdjacentBro(idx2item, mom2idxs, pivotIdx, targetSet);
  const leftBro = dir === "LEFT" ? adjacentBro.leftBro : pivot.bro;
  const rightBro = dir === "LEFT" ? pivot.bro : adjacentBro.rightBro;
  const flatIdxs = getFlatIdxs(mom2idxs, targetSet, "TARGET");
  const bros = generateNKeysBetween(leftBro, rightBro, flatIdxs.length);
  const idx2new = new Map<number, Partial<T>>();
  for (let i = 0; i < flatIdxs.length; i++)
    idx2new.set(flatIdxs[i], { mom: newMom, bro: bros[i] } as Partial<T>);

  return modifyItems(list, idx2new);
};

const setFamilyMom = <T extends Family>(
  list: ReadonlyArray<T>,
  targetSet: ReadonlySet<number>,
  newMom: number
): T[] => {
  if (targetSet.size === 0) return list as T[];

  const familyMap = makeFamilyMap(list);
  const { idx2item, mom2idxs } = familyMap;
  if (isMomCyclic(idx2item, newMom, targetSet)) return list as T[];

  const firstBro = idx2item.get(mom2idxs.get(newMom)?.[0] ?? -1)?.bro ?? null;
  const flatIdxs = getFlatIdxs(mom2idxs, targetSet, "TARGET");
  const bros = generateNKeysBetween(null, firstBro, flatIdxs.length);
  const idx2new = new Map<number, Partial<T>>();
  for (let i = 0; i < flatIdxs.length; i++)
    idx2new.set(flatIdxs[i], { mom: newMom, bro: bros[i] } as Partial<T>);

  return modifyItems(list, idx2new);
};

export { getNewBro, deleteFamilyMap, setFamilyMom, setBro };
