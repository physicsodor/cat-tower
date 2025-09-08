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

export const replaceIdxItem = <T extends IdxItem>(
  TList: T[],
  idx: number,
  setT: (prev: T) => T
): { newList: T[] } => {
  return { newList: TList.map((t) => (t.idx === idx ? setT(t) : t)) };
};

export const deleteIdxItem = <T extends IdxItem>(
  TList: T[],
  targetSet: Set<number>
): { newList: T[] } => {
  if (targetSet.size === 0) return { newList: TList };
  let isChanged = false;
  const newList = TList.filter((t) => {
    const isTarget = targetSet.has(t.idx);
    if (isTarget) isChanged = true;
    return !isTarget;
  });
  return { newList: isChanged ? newList : TList };
};
