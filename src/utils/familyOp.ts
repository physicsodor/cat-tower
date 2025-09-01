import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import { type Family } from "../types/Family";
import {
  addIdxItem,
  deleteIdxItem,
  getItemByIdx,
  makeIdx2ItemMap,
} from "./idxItemOp";

const _cmpBro = <T extends Family>(a: T, b: T) =>
  a.bro < b.bro ? -1 : a.bro > b.bro ? 1 : 0;

export const getItemsByMom = <T extends Family>(TList: T[], mom: number) => {
  return TList.filter((t) => t.mom === mom).sort(_cmpBro);
};

export const getLastBro = <T extends Family>(
  TList: T[],
  mom: number = -1,
  ignore: Set<number> = new Set()
) => {
  const broList = getItemsByMom(TList, mom);
  for (let i = broList.length - 1; i >= 0; i--) {
    if (!ignore.has(broList[i].idx)) return broList[i].bro;
  }
  return null;
};

export const getPreBro = <T extends Family>(
  TList: T[],
  nxtIdx: number,
  ignore: Set<number> = new Set()
) => {
  const nxtItem = getItemByIdx(TList, nxtIdx);
  if (!nxtItem) return null;

  const broList = getItemsByMom(TList, nxtItem.mom);
  const nxt_i = broList.findIndex((t) => t.idx === nxtIdx);
  if (nxt_i < 0) return null;
  for (let i = nxt_i - 1; i >= 0; i--) {
    if (!ignore.has(broList[i].idx)) return broList[i].bro;
  }
  return null;
};

export const getNxtBro = <T extends Family>(
  TList: T[],
  preIdx: number,
  ignore: Set<number> = new Set()
) => {
  const preItem = getItemByIdx(TList, preIdx);
  if (!preItem) return null;
  const broList = getItemsByMom(TList, preItem.mom);
  const pre_i = broList.findIndex((t) => t.idx === preIdx);
  if (pre_i < 0) return null;
  for (let i = pre_i + 1; i < broList.length; i++) {
    if (!ignore.has(broList[i].idx)) return broList[i].bro;
  }
  return null;
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
      bro: generateKeyBetween(getLastBro(TList, mom), null),
      isMom,
    })
  );
};

export const deleteFamily = <T extends Family>(
  TList: T[],
  targetSet: Set<number>
): { newList: T[] } => {
  const idx2mom = makeIdx2MomMap(TList, targetSet);
  const result = deleteIdxItem(TList, targetSet);
  result.newList = result.newList.map((t) =>
    targetSet.has(t.mom) ? { ...t, mom: idx2mom.get(t.mom) ?? -1 } : t
  );
  return result;
};

const _isMomCyclic = <T extends Family>(
  idx2Item: Map<number, T>,
  targetSet: Set<number>,
  startMom: number
) => {
  let testMom = startMom;
  while (testMom >= 0) {
    if (targetSet.has(testMom)) return true;
    testMom = idx2Item.get(testMom)?.mom ?? -1;
  }
  return false;
};

const makeFamilySublist = <T extends Family>(
  TList: T[],
  targetSet: Set<number> = new Set()
) => {
  const mom2items = new Map<number, T[]>();
  for (const t of TList) {
    if (targetSet.size > 0 && !targetSet.has(t.idx)) continue;
    const tempItems = mom2items.get(t.mom) ?? [];
    tempItems.push(t);
    mom2items.set(t.mom, tempItems);
  }
  const momList: number[] = [];
  const visited = new Set<number>();
  for (const t of TList) {
    if (!mom2items.has(t.mom) || visited.has(t.mom)) continue;
    visited.add(t.mom);
    momList.push(t.mom);
  }

  const result: number[] = [];
  for (const m of momList) {
    const tempItems = mom2items.get(m)!;
    tempItems.sort(_cmpBro);
    for (const x of tempItems) result.push(x.idx);
  }
  return result;
};

export const setMom = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  newMom: number
): { newList: T[]; isErr: boolean } => {
  // Test //
  const result = { newList: TList, isErr: true };
  if (targetSet.size === 0) return result;
  const idx2Item = makeIdx2ItemMap(TList);
  if (_isMomCyclic(idx2Item, targetSet, newMom)) return result;

  // Operation //
  const newBroList = generateNKeysBetween(
    getLastBro(TList, newMom, targetSet),
    null,
    targetSet.size
  );
  const targetIdxList = makeFamilySublist(TList, targetSet);
  const idx2bro = new Map<number, string>();
  targetIdxList.forEach((idx, i) => idx2bro.set(idx, newBroList[i]));
  result.newList = TList.map((t) =>
    targetSet.has(t.idx) ? { ...t, mom: newMom, bro: idx2bro.get(t.idx)! } : t
  );
  result.isErr = false;
  return result;
};

export const setPreBro = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  preIdx: number
): { newList: T[]; isErr: boolean } => {
  const result = { newList: TList, isErr: true };
  if (targetSet.size === 0 || targetSet.has(preIdx)) return result;
  const preItem = getItemByIdx(TList, preIdx);
  if (!preItem) return result;
  const idx2Item = makeIdx2ItemMap(TList);
  if (_isMomCyclic(idx2Item, targetSet, preItem.mom)) return result;

  const newBroList = generateNKeysBetween(
    preItem.bro,
    getNxtBro(TList, preIdx, targetSet),
    targetSet.size
  );
  const targetIdxList = makeFamilySublist(TList, targetSet);
  const idx2bro = new Map<number, string>();
  targetIdxList.forEach((idx, i) => idx2bro.set(idx, newBroList[i]));
  result.newList = TList.map((t) =>
    targetSet.has(t.idx)
      ? { ...t, mom: preItem.mom, bro: idx2bro.get(t.idx)! }
      : t
  );
  result.isErr = false;
  return result;
};

export const setNxtBro = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  nxtIdx: number
): { newList: T[]; isErr: boolean } => {
  const result = { newList: TList, isErr: true };
  if (targetSet.size === 0 || targetSet.has(nxtIdx)) return result;
  const nxtItem = getItemByIdx(TList, nxtIdx);
  if (!nxtItem) return result;
  const idx2Item = makeIdx2ItemMap(TList);
  if (_isMomCyclic(idx2Item, targetSet, nxtItem.mom)) return result;

  const newBroList = generateNKeysBetween(
    getPreBro(TList, nxtIdx, targetSet),
    nxtItem.bro,
    targetSet.size
  );
  const targetIdxList = makeFamilySublist(TList, targetSet);
  const idx2bro = new Map<number, string>();
  targetIdxList.forEach((idx, i) => idx2bro.set(idx, newBroList[i]));
  result.newList = TList.map((t) =>
    targetSet.has(t.idx)
      ? { ...t, mom: nxtItem.mom, bro: idx2bro.get(t.idx)! }
      : t
  );
  result.isErr = false;
  return result;
};
