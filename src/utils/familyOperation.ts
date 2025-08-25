import type { Family } from "../types/Family";

export const getNewIdx = <T extends Family>(TList: T[], start = 0) => {
  const idxList = new Set(TList.map((t) => t.idx));
  let i = start;
  while (idxList.has(i)) i++;
  return i;
};

export const getItemByIdx = <T extends Family>(TList: T[], idx: number) => {
  for (const t of TList) if (t.idx === idx) return t;
  return undefined;
};

export const getMomByIdx = <T extends Family>(TList: T[], idx: number) => {
  for (const t of TList) if (t.idx === idx) return t.mom;
  return -1;
};
