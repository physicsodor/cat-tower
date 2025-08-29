import { type Family } from "../types/Family";
import {
  addIdxItem,
  deleteIdxItem,
  getItemByIdx,
  makeIdx2ItemMap,
} from "./idxItemOp";

export const makeIdx2BroMap = <T extends Family>(
  TList: T[],
  ignore: Set<number> = new Set()
): Map<number, number> => {
  const result = new Map<number, number>();
  const idx2Item = makeIdx2ItemMap(TList);

  for (const x of TList) {
    if (!ignore.has(x.idx)) continue;
    let b = x.bro;
    while (b >= 0 && ignore.has(b)) {
      b = idx2Item.get(b)?.bro ?? -1;
    }
    result.set(x.idx, b);
  }
  return result;
};

export const makeIdx2MomMap = <T extends Family>(
  TList: T[],
  ignore: Set<number> = new Set()
): Map<number, number> => {
  const result = new Map<number, number>();
  const idx2Item = makeIdx2ItemMap(TList);

  for (const x of TList) {
    if (!ignore.has(x.idx)) continue;
    let m = x.mom;
    while (m >= 0 && ignore.has(m)) {
      m = idx2Item.get(m)?.mom ?? -1;
    }
    result.set(x.idx, m);
  }
  return result;
};

export const getNewBro = <T extends Family>(
  TList: T[],
  mom = -1,
  ignore?: Set<number>
) => {
  const broList = TList.filter((t) => t.mom === mom);
  if (broList.length === 0) return -1;

  const broMap = new Map<number, number>();
  for (const x of broList) broMap.set(x.bro, x.idx);

  let nBro = -1;
  if (!ignore || ignore.size === 0) {
    while (broMap.has(nBro)) nBro = broMap.get(nBro)!;
    return nBro;
  }
  let nnBro = broMap.get(nBro);
  while (true) {
    while (nnBro !== undefined && ignore.has(nnBro)) {
      nnBro = broMap.get(nnBro);
    }
    if (nnBro === undefined) return nBro;
    nBro = nnBro;
    nnBro = broMap.get(nBro);
  }
};

export const addFamily = <T extends Family>(
  TList: T[],
  newT: (s: Family) => T,
  mom: number,
  isMom: boolean
): { newIdx: number; newList: T[] } => {
  return addIdxItem(TList, (idx) =>
    newT({
      idx,
      mom,
      bro: getNewBro(TList, mom),
      isMom,
    })
  );
};

export const deleteFamily = <T extends Family>(
  TList: T[],
  targetSet: Set<number>
): { newList: T[] } => {
  const idx2mom = makeIdx2MomMap(TList, targetSet);
  const idx2bro = makeIdx2BroMap(TList, targetSet);
  const result = deleteIdxItem(TList, targetSet);
  result.newList = result.newList.map((t) => {
    if (targetSet.has(t.mom)) {
      const newT = { ...t, mom: idx2mom.get(t.mom), bro: idx2bro.get(t.mom) };
      idx2bro.set(t.mom, t.idx);
      return newT;
    }
    if (targetSet.has(t.bro)) return { ...t, bro: idx2bro.get(t.bro) };
    return t;
  });
  return result;
};

export const setMom = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  newMom: number
): { newList: T[]; isErr: boolean } => {
  // Test //
  let isErr = true;
  if (targetSet.size === 0) return { newList: TList, isErr };
  let testMom = newMom;
  while (testMom >= 0) {
    if (targetSet.has(testMom)) return { newList: TList, isErr };
    testMom = getItemByIdx(TList, testMom)?.mom ?? -1;
  }

  // Operation //
  const idx2bro = makeIdx2BroMap(TList, targetSet);
  let newBro = getNewBro(TList, newMom, targetSet);
  const newList = TList.map((t) => {
    if (targetSet.has(t.idx)) {
      const result = { ...t, mom: newMom, bro: newBro };
      newBro = t.idx;
      return result;
    }
    if (targetSet.has(t.bro)) return { ...t, bro: idx2bro.get(t.bro) };
    return t;
  });
  return { newList, isErr: false };
};

export const setBro = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  newBro: number
): { newList: T[]; isErr: boolean } => {
  let isErr = true;
  if (targetSet.size === 0) return { newList: TList, isErr };
  const broItem = TList.find((t) => t.idx === newBro);
  if (!broItem) return { newList: TList, isErr };
  const result = setMom(TList, targetSet, broItem.mom);
  if (result.isErr) return { newList: TList, isErr };
  const pIdx = result.newList.find((t) => t.bro === newBro)?.idx ?? -1;
  if (pIdx < 0) return { newList: TList, isErr };
  const tIdx =
    result.newList.find((t) => targetSet.has(t.idx) && !targetSet.has(t.bro))
      ?.idx ?? -1;
  if (tIdx < 0) return { newList: TList, isErr };
  const pBro = getNewBro(result.newList, broItem.mom);
  const newList = result.newList.map((t) =>
    t.idx === pIdx
      ? { ...t, bro: pBro }
      : t.idx === tIdx
      ? { ...t, bro: newBro }
      : t
  );

  return { newList, isErr: false };
};
