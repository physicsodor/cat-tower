import { useState } from "react";
import { type Course, type Subject } from "../types/Curriculum";
import type { SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOp";
import { getItemByIdx } from "../utils/idxItemOp";
import { setBro, setMom } from "../utils/familyOp";
import { addCourse, addSubject, deleteCurriculum } from "../utils/curriculumOp";
import type { InsertMode } from "../types/InsertMode";

export const useSubject = () => {
  const [sbjList, setSbjList] = useState<(Subject | Course)[]>([]);
  const [selSet, setSelSet] = useState<Set<number>>(new Set());
  const [sbjDrag, setSbjDrag] = useState(false);
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
    setSbjList((prev) => deleteCurriculum(prev, selSet).newList);
    setSelSet(new Set());
  };
  const delCrs = (idx: number) => () => {
    if (idx < 0) return;
    setSbjList((prev) => deleteCurriculum(prev, new Set([idx])).newList);
  };

  const setSbjMom = (newMom: number) => {
    const targetSet =
      crsDrag >= 0 ? new Set([crsDrag]) : sbjDrag ? selSet : new Set<number>();
    if (targetSet.size > 0)
      setSbjList((prev) => setMom(prev, targetSet, newMom).newList);
    if (crsDrag >= 0) setCrsDrag(-1);
    if (sbjDrag) setSbjDrag(false);
  };

  const setSbjBro = (pivotIdx: number, dir: InsertMode) => {
    const targetSet =
      crsDrag >= 0 ? new Set([crsDrag]) : sbjDrag ? selSet : new Set<number>();
    if (targetSet.size > 0)
      setSbjList((prev) => setBro(prev, targetSet, pivotIdx, dir).newList);
    if (crsDrag >= 0) setCrsDrag(-1);
    if (sbjDrag) setSbjDrag(false);
  };

  const selSbj = (mode: SelectMode, ...idxList: number[]) => {
    const idxSet = new Set(
      idxList.filter((idx) => {
        const trg = getItemByIdx(sbjList, idx);
        return trg && trg.sbjType === "Subject";
      })
    );
    if (mode === "ADD") setSelSet((prev) => setUni(prev, idxSet));
    else if (mode === "REPLACE") setSelSet(idxSet);
    else if (mode === "REMOVE") setSelSet((prev) => setDif(prev, idxSet));
  };

  const selSbjDrag = (b: boolean) => setSbjDrag(selSet.size === 0 ? false : b);

  const selCrsDrag = (i: number) => {
    const trg = getItemByIdx(sbjList, i);
    if (!trg || trg.sbjType === "Subject") return;
    setCrsDrag(i);
  };

  const clearDrag = () => {
    setCrsDrag(-1);
    setSbjDrag(false);
  };

  return {
    isDrag: sbjDrag === true || crsDrag >= 0,
    sbjList,
    selSet,
    addSbj,
    addCrs,
    clearDrag,
    delSbj,
    delCrs,
    setSbjBro,
    setSbjMom,
    selCrsDrag,
    selSbj,
    selSbjDrag,
  };
};
