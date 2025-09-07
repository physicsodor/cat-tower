import { isChain, type Chain } from "../types/Chain";
import {
  addIdxItem,
  deleteIdxItem,
  makeIdx2Item,
  replaceIdxItem,
} from "./idxItemOp";
import { setDel } from "./setOp";

export const getPreSet = <T extends Chain>(
  TList: T[],
  pivotIdx: number
): Set<number> => {
  const idx2item = makeIdx2Item(TList);
  const pivot = idx2item.get(pivotIdx);
  if (!pivot) return new Set();
  const preSet = new Set<number>();
  const pushItems = (testSet: Set<number>) => {
    for (const idx of testSet) {
      const x = idx2item.get(idx);
      if (!x || preSet.has(x.idx)) continue;
      preSet.add(x.idx);
      if (x.pre.size > 0) pushItems(x.pre);
    }
  };
  pushItems(pivot.pre);
  return preSet;
};

export const addChain = <T extends Chain>(
  TList: T[],
  newT: (s: Chain) => T
): { newIdx: number; newList: T[] } => {
  return addIdxItem(TList, (idx) => newT({ idx, pre: new Set() }));
};

export const replaceChain = <T extends Chain, S = unknown>(
  TList: (T | S)[],
  idx: number
): { newList: (T | S)[] } => {
  const subList: T[] = replaceIdxItem(
    TList.filter((t) => isChain<T>(t)),
    idx,
    (prev) => ({
      ...prev,
      pre: new Set(),
    })
  ).newList;

  let i = 0;
  const newList = TList.map((t) => (isChain<T>(t) ? subList[i++] : t));

  return { newList };
};

export const deleteChain = <T extends Chain, S = unknown>(
  TList: (T | S)[],
  targetSet: Set<number>
): { newList: (T | S)[] } => {
  const subList: T[] = deleteIdxItem(
    TList.filter((t) => isChain<T>(t)),
    targetSet
  ).newList;
  for (const x of subList) setDel(x.pre, targetSet);

  let i = 0;
  const newList: (T | S)[] = [];
  for (const t of TList) {
    if (isChain<T>(t)) newList.push(subList[i++]);
    else newList.push(t);
  }

  return { newList };
};
