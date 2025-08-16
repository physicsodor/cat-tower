export const getNewIdx = <T extends { idx: number }>(TList: T[], start = 0) => {
  const idxList = new Set(TList.map((t) => t.idx));
  let i = start;
  while (idxList.has(i)) i++;
  return i;
};

export const indexByIdx = <T extends { idx: number }>(
  TList: T[],
  idx: number
) => {
  for (let i = 0; i < TList.length; i++) {
    if (TList[i].idx === idx) return i;
  }
  return -1;
};

export const itemByIdx = <T extends { idx: number }>(
  TList: T[],
  idx: number
) => {
  for (let t of TList) {
    if (t.idx === idx) return t;
  }
  return undefined;
};
