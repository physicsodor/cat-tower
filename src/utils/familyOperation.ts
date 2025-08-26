import type { Family } from "../types/Family";

export const getNewIdx = <T extends Family>(TList: T[], start = 0) => {
  const idxList = new Set(TList.map((t) => t.idx));
  let i = start;
  while (idxList.has(i)) i++;
  return i;
};

export const getItemByIdx = <T extends Family>(TList: T[], idx: number) => {
  return TList.find((t) => t.idx === idx);
};

export const getMomByIdx = <T extends Family>(TList: T[], idx: number) => {
  return TList.find((t) => t.idx === idx)?.mom ?? -1;
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
