import { DefCrs, type Course } from "../types/Course";
import type { Subject } from "../types/Subject";
import { setAdd } from "./setOperation";
import { itemByIdx } from "./idxOperation";

export const validate = (sbjList: Subject[], crsList: Course[]) => {
  const pSbjList = [...sbjList];
  const pCrsList = [...crsList];
  _testIdx(pSbjList);
  _testIdx(pCrsList);
  _testMom(pSbjList, pCrsList);
  return pSbjList;
};

const _testIdx = <T extends { idx: number }>(TList: T[]) => {
  const idxSet = new Set(TList.map((sbj) => sbj.idx));
  const usedSet = new Set<number>();
  let n = 0;
  while (idxSet.has(n)) n++;
  for (let i = 0; i < TList.length; i++) {
    const t = TList[i];
    const idx = t.idx;
    if (idx >= 0 && !usedSet.has(idx) && Number.isInteger(idx)) {
      usedSet.add(idx);
    } else {
      t.idx = n;
      idxSet.add(n);
      do n++;
      while (idxSet.has(n));
    }
  }
};

const _testMom = (sbjList: Subject[], crsList: Course[]) => {
  const idxSet = new Set(crsList.map((crs) => crs.idx));
  const usedSet = new Set<number>();
  const tempSet = new Set<number>();

  for (let i = 0; i < crsList.length; i++) {
    if (usedSet.has(crsList[i].idx)) continue;

    tempSet.clear();
    let crs = crsList[i];
    while (true) {
      const mom = crs.mom;
      const idx = crs.idx;

      tempSet.add(idx);
      if (mom >= 0 && idxSet.has(mom) && !tempSet.has(mom)) {
        crs = itemByIdx(crsList, mom) || DefCrs();
      } else {
        crs.mom = -1;
        setAdd(usedSet, tempSet);
        break;
      }
    }
  }

  for (let i = 0; i < sbjList.length; i++) {
    let sbj = sbjList[i];
    if (!idxSet.has(sbj.mom)) sbj.mom = -1;
  }
};
