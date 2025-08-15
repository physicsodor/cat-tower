import type { Subject } from "../types/Subject";
import { setAdd } from "./setOp";

export const testSubjectList = (sbjList: Subject[]) => {
  const pSbjList = [...sbjList];
  _testIdx(pSbjList);
  _testMom(pSbjList);
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
    if (idx >= 0 && !usedSet.has(idx) && Number.isInteger(idx)) {
      usedSet.add(idx);
    } else {
      sbj.idx = n;
      idxSet.add(n);
      do n++;
      while (idxSet.has(n));
    }
  }
};

const _testMom = (sbjList: Subject[]) => {
  const idxSet = new Set(sbjList.map((sbj) => sbj.idx));
  const usedSet = new Set<number>();
  const tempSet = new Set<number>();

  const ordByIdx = (idx: number) => {
    for (let i = 0; i < sbjList.length; i++) {
      if (sbjList[i].idx === idx) return i;
    }
    return -1;
  };

  for (let i = 0; i < sbjList.length; i++) {
    if (usedSet.has(sbjList[i].idx)) continue;

    tempSet.clear();
    let j = i;
    while (true) {
      const sbj = sbjList[j];
      const mom = sbj.mom;
      const idx = sbj.idx;

      tempSet.add(idx);
      if (mom >= 0 && idxSet.has(mom) && !tempSet.has(mom)) {
        j = ordByIdx(mom);
      } else {
        sbj.mom = -1;
        setAdd(usedSet, tempSet);
        break;
      }
    }
  }
};
