import { useCallback, useState } from "react";
import { DefSbj, type Subject } from "../types/Subject";
import { getNewIdx, getItemByIdx, getMomByIdx } from "../utils/familyOperation";
import type { SelectMode } from "../types/SelectMode";
import { setDel, setDif, setUni } from "../utils/setOperation";
import { DefCrs, type Course } from "../types/Course";

export const useSubject = () => {
  const [sbjList, setSbjList] = useState<(Subject | Course)[]>([]);
  const [slcSet, setSlcSet] = useState<Set<number>>(new Set());

  /** Add a Subject. */
  const addSbj = (isCourse: boolean) => () => {
    const i = getNewIdx(sbjList);
    setSbjList((prev) => [...prev, isCourse ? DefCrs(i) : DefSbj(i)]);
    selectSbj("REPLACE", i);
  };

  /** Delete the Subjects in trgSet. */
  const deleteSbj = () => {
    const momMap = new Map<number, number>();
    for (let i of slcSet) momMap.set(i, getMomByIdx(sbjList, i));
    setSbjList(
      (prev) =>
        prev
          .filter((sbj) => !slcSet.has(sbj.idx)) // Delete the Subjects.
          .map((sbj) => {
            if (!slcSet.has(sbj.mom)) return sbj;
            return { ...sbj, mom: momMap.get(sbj.mom) ?? -1 };
          }) // Correct mom of the Subjects whose mom was deleted.
    );
    selectSbj("REPLACE");
  };

  /** Select Subjects by idxList */
  const selectSbj = useCallback((mode: SelectMode, ...idxList: number[]) => {
    const idxSet = new Set(idxList);
    if (mode === "ADD") {
      setSlcSet((prev) => setUni(prev, idxSet));
    } else if (mode === "REPLACE") {
      setSlcSet(idxSet);
    } else if (mode === "REMOVE") {
      setSlcSet((prev) => setDif(prev, idxSet));
    }
  }, []);

  const setSbjMom = (nMom: number) => {
    const trgSet = new Set(slcSet);
    const visited = new Set([nMom]);
    let momSbj = getItemByIdx(sbjList, nMom);
    while (momSbj && momSbj.mom >= -1 && !visited.has(momSbj.mom)) {
      visited.add(momSbj.mom);
      momSbj = getItemByIdx(sbjList, momSbj.mom);
    }
    setDel(trgSet, visited);
    if (trgSet.size > 0) {
      setSbjList((prev) =>
        prev.map((sbj) => (trgSet.has(sbj.idx) ? { ...sbj, mom: nMom } : sbj))
      );
      setSlcSet(trgSet);
    }
  };

  return {
    sbjList,
    slcSet,
    addSbj,
    deleteSbj,
    selectSbj,
    setSbjMom,
  };
};
