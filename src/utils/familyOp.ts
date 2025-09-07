import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import { type Family } from "../types/Family";
import {
  addIdxItem,
  deleteIdxItem,
  getItemByIdx,
  makeIdx2Item,
  replaceIdxItem,
} from "./idxItemOp";
import type { InsertMode } from "../types/InsertMode";

const compareBro = <T extends Family>(a: T, b: T) =>
  a.bro < b.bro ? -1 : a.bro > b.bro ? 1 : 0;

export const getItemsByMom = <T extends Family>(TList: T[], mom: number) => {
  return TList.filter((t) => t.mom === mom).sort(compareBro);
};

const getFirstBro = <T extends Family>(
  TList: T[],
  mom: number = -1,
  ignore: Set<number> = new Set()
): string | null => {
  const broList = getItemsByMom(TList, mom);
  for (let i = 0; i < broList.length; i++) {
    if (!ignore.has(broList[i].idx)) return broList[i].bro;
  }
  return null;
};

const getLastBro = <T extends Family>(
  TList: T[],
  mom: number = -1,
  ignore: Set<number> = new Set()
): string | null => {
  const broList = getItemsByMom(TList, mom);
  for (let i = broList.length - 1; i >= 0; i--) {
    if (!ignore.has(broList[i].idx)) return broList[i].bro;
  }
  return null;
};

const getAdjacentBro = <T extends Family>(
  TList: T[],
  pivotItem: T,
  dir: InsertMode,
  ignore: Set<number> = new Set()
): string | null => {
  const broList = getItemsByMom(TList, pivotItem.mom);
  const i = broList.findIndex((t) => t.idx === pivotItem.idx);
  if (i < 0) return null;

  if (dir === "PREVIOUS") {
    for (let k = i - 1; k >= 0; k--) {
      if (!ignore.has(broList[k].idx)) return broList[k].bro;
    }
  } else {
    for (let k = i + 1; k < broList.length; k++) {
      if (!ignore.has(broList[k].idx)) return broList[k].bro;
    }
  }
  return null;
};

const isMomCyclic = <T extends Family>(
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

const makeFamilyList = <T extends Family>(
  TList: T[],
  targetSet: Set<number> = new Set(TList.map((t) => t.idx))
): number[] => {
  if (targetSet.size === 0) return [];

  const idx2Item = makeIdx2Item(TList);
  const targetMomSet = new Set<number>();
  for (const idx of targetSet) {
    let mom = idx2Item.get(idx)?.mom ?? -1;
    while (mom >= 0 && !targetMomSet.has(mom)) {
      targetMomSet.add(mom);
      mom = idx2Item.get(mom)?.mom ?? -1;
    }
  }
  targetMomSet.add(-1);

  const mom2items = new Map<number, T[]>();
  for (const t of TList) {
    if (!targetMomSet.has(t.mom)) continue;
    const arr = mom2items.get(t.mom);
    if (arr) arr.push(t);
    else mom2items.set(t.mom, [t]);
  }

  for (const arr of mom2items.values())
    if (arr.length > 1) arr.sort(compareBro);

  const result: number[] = [];
  const visited = new Set<number>();
  const pushItems = (mom: number) => {
    const arr = mom2items.get(mom);
    if (!arr) return;
    for (const x of arr) {
      if (visited.has(x.idx)) continue;
      visited.add(x.idx);
      if (targetSet.has(x.idx)) result.push(x.idx);
      pushItems(x.idx);
    }
  };
  pushItems(-1);

  return result;
};

const makeIdx2Mom = <T extends Family>(
  TList: T[],
  ignore: Set<number> = new Set()
): Map<number, number> => {
  const result = new Map<number, number>();
  const idx2Item = makeIdx2Item(TList);

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

const relocateFamily = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  newMom: number,
  leftBro: string | null,
  rightBro: string | null
): { newList: T[]; isErr: boolean } => {
  const result = { newList: TList, isErr: true };
  if (targetSet.size === 0) return result;

  const idx2Item = makeIdx2Item(TList);
  if (isMomCyclic(idx2Item, targetSet, newMom)) return result;

  const idxList = makeFamilyList(TList, targetSet);
  const newBroList = generateNKeysBetween(leftBro, rightBro, targetSet.size);
  const idx2bro = new Map<number, string>();
  idxList.forEach((idx, i) => idx2bro.set(idx, newBroList[i]));
  result.newList = TList.map((t) =>
    targetSet.has(t.idx) ? { ...t, mom: newMom, bro: idx2bro.get(t.idx)! } : t
  );
  result.isErr = false;
  return result;
};

export const addFamily = <T extends Family>(
  TList: T[],
  newT: (s: Family) => T,
  mom: number
): { newIdx: number; newList: T[] } => {
  const bro = generateKeyBetween(getLastBro(TList, mom), null);
  return addIdxItem(TList, (idx) => newT({ idx, mom, bro }));
};

export const replaceFamily = <T extends Family>(
  TList: T[],
  idx: number,
  mom: number
) => {
  const bro = generateKeyBetween(getLastBro(TList, mom), null);
  return replaceIdxItem(TList, idx, (prev) => ({ ...prev, mom, bro }));
};

export const deleteFamily = <T extends Family>(
  TList: T[],
  targetSet: Set<number>
): { newList: T[] } => {
  const idx2mom = makeIdx2Mom(TList, targetSet);
  const result = deleteIdxItem(TList, targetSet);
  result.newList = result.newList.map((t) =>
    targetSet.has(t.mom) ? { ...t, mom: idx2mom.get(t.mom) ?? -1 } : t
  );
  return result;
};

export const setMom = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  newMom: number
) => {
  return relocateFamily(
    TList,
    targetSet,
    newMom,
    null,
    getFirstBro(TList, newMom, targetSet)
  );
};

export const setBro = <T extends Family>(
  TList: T[],
  targetSet: Set<number>,
  pivotIdx: number,
  dir: InsertMode
): { newList: T[]; isErr: boolean } => {
  const pivot = getItemByIdx(TList, pivotIdx);
  if (!pivot || targetSet.has(pivotIdx)) return { newList: TList, isErr: true };
  const adjacentBro = getAdjacentBro(TList, pivot, dir, targetSet);

  return relocateFamily(
    TList,
    targetSet,
    pivot.mom,
    dir === "PREVIOUS" ? adjacentBro : pivot.bro,
    dir === "PREVIOUS" ? pivot.bro : adjacentBro
  );
};
