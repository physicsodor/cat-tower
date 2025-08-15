import type { Subject } from "../types/Subject";

export const testSubjectList = (sbjList: Subject[]) => {
  const pSbjList = [...sbjList];
  _testIdx(pSbjList);

  return pSbjList;
};

const _testIdx = (sbjList: Subject[]) => {
  const idxSet = new Set(sbjList.map((sbj) => sbj.idx));
  const usedSet = new Set<number>();
  let n = 0;
  while (idxSet.has(n)) n++;
  for (let i = 0; i < sbjList.length; i++) {
    const sbj = sbjList[i];
    const idx = sbj.idx;
    if (idx >= 0 && !usedSet.has(idx)) {
      usedSet.add(idx);
    } else {
      sbj.idx = n;
      idxSet.add(n);
      do n++;
      while (idxSet.has(n));
    }
  }
};
