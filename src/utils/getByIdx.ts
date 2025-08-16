export const ordByIdx = <T extends { idx: number }>(
  TList: T[],
  idx: number
) => {
  for (let i = 0; i < TList.length; i++) {
    if (TList[i].idx === idx) return i;
  }
  return -1;
};

export const itmByIdx = <T extends { idx: number }>(
  TList: T[],
  idx: number
) => {
  for (let t of TList) {
    if (t.idx === idx) return t;
  }
  return undefined;
};
