import { type IdxItem } from "../types/IdxItem";

export const makeIdx2Item = <T extends IdxItem>(TList: T[]) =>
  new Map(TList.map((x) => [x.idx, x] as const));

export const getNewIdx = <T extends IdxItem>(TList: T[], start = 0) => {
  const idxList = new Set(TList.map((t) => t.idx));
  let i = start;
  while (idxList.has(i)) i++;
  return i;
};

export const getItemByIdx = <T extends IdxItem>(TList: T[], idx: number) => {
  return TList.find((t) => t.idx === idx);
};

export const addIdxItem = <T extends IdxItem>(
  TList: T[],
  newT: (idx: number) => T
): { newIdx: number; newList: T[] } => {
  const newIdx = getNewIdx(TList);
  const newList = [...TList, newT(newIdx)];
  return { newIdx, newList };
};

export const deleteIdxItem = <T extends IdxItem>(
  TList: T[],
  targetSet: Set<number>
): { newList: T[] } => {
  const newList = TList.filter((t) => !targetSet.has(t.idx));
  return { newList };
};
