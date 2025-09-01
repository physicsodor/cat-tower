import { useState } from "react";
import { type Course, type Subject } from "../types/Subject";
import type { SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOp";
import { getItemByIdx } from "../utils/idxItemOp";
import { setMom } from "../utils/familyOp";
import { addCourse, addSubject, deleteSubject } from "../utils/subjectOp";

export const useSubject = () => {
  const [sbjList, setSbjList] = useState<(Subject | Course)[]>([]);
  const [selSet, setSelSet] = useState<Set<number>>(new Set());
  const [crsDrag, setCrsDrag] = useState(-1);

  const addSbj = () => {
    setSbjList((prev) => {
      const result = addSubject(prev);
      setSelSet(new Set([result.newIdx]));
      return result.newList;
    });
  };
  const addCrs = () => {
    setSbjList((prev) => {
      const result = addCourse(prev);
      return result.newList;
    });
  };

  const delSbj = () => {
    if (selSet.size === 0) return;
    setSbjList((prev) => deleteSubject(prev, selSet).newList);
    setSelSet(new Set());
  };
  const delCrs = (idx: number) => () => {
    if (idx < 0) return;
    setSbjList((prev) => deleteSubject(prev, new Set([idx])).newList);
  };

  const setSbjMom = (newMom: number) => {
    setSbjList((prev) => setMom(prev, selSet, newMom).newList);
  };
  const setCrsMom = (newMom: number) => {
    setSbjList((prev) => setMom(prev, new Set([crsDrag]), newMom).newList);
    setCrsDrag(-1);
  };

  const selSbj = (mode: SelectMode, ...idxList: number[]) => {
    const idxSet = new Set(
      idxList.filter((idx) => {
        const trg = getItemByIdx(sbjList, idx);
        return trg && !trg.isMom;
      })
    );
    if (mode === "ADD") setSelSet((prev) => setUni(prev, idxSet));
    else if (mode === "REPLACE") setSelSet(idxSet);
    else if (mode === "REMOVE") setSelSet((prev) => setDif(prev, idxSet));
  };

  const selCrsDrag = (i: number) => {
    const trg = getItemByIdx(sbjList, i);
    if (!trg || !trg.isMom) return;
    setCrsDrag(i);
  };

  return {
    sbjList,
    selSet,
    crsDrag,
    addSbj,
    addCrs,
    delSbj,
    delCrs,
    setSbjMom,
    setCrsMom,
    selCrsDrag,
    selSbj,
  };
};
