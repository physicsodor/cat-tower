import React, { useRef, useState } from "react";
import { type Course, type Subject } from "../types/Curriculum";
import type { SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOp";
import { getItemByIdx } from "../utils/idxItemOp";
import { setBro, setMom } from "../utils/familyOp";
import {
  addCourse,
  addSubject,
  deleteCurriculum,
  setSubjectXY,
} from "../utils/curriculumOp";
import type { InsertMode } from "../types/InsertMode";

export const useCurriculum = () => {
  const [sbjList, setSbjList] = useState<(Subject | Course)[]>([]);
  const [selSet, setSelSet] = useState<Set<number>>(new Set());
  const [treeSbjDrag, setTreeSbjDrag] = useState(false);
  const [treeCrsDrag, setTreeCrsDrag] = useState(-1);
  const [cnvsSbjDrag, setCnvsSbjDrag] = useState(false);
  const [cnvsCrsDrag, setCnvsCrsDrag] = useState(-1);
  const selModeRef = useRef<SelectMode>("NONE");

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
      treeCrsDrag >= 0
        ? new Set([treeCrsDrag])
        : treeSbjDrag
        ? selSet
        : new Set<number>();
    if (targetSet.size > 0)
      setSbjList((prev) => setMom(prev, targetSet, newMom).newList);
    if (treeCrsDrag >= 0) setTreeCrsDrag(-1);
    if (treeSbjDrag) setTreeSbjDrag(false);
  };

  const setSbjBro = (pivotIdx: number, dir: InsertMode) => {
    const targetSet =
      treeCrsDrag >= 0
        ? new Set([treeCrsDrag])
        : treeSbjDrag
        ? selSet
        : new Set<number>();
    if (targetSet.size > 0)
      setSbjList((prev) => setBro(prev, targetSet, pivotIdx, dir).newList);
    if (treeCrsDrag >= 0) setTreeCrsDrag(-1);
    if (treeSbjDrag) setTreeSbjDrag(false);
  };

  const setSelMode = <T extends HTMLElement = HTMLDivElement>(
    e: React.PointerEvent<T>,
    pivotIdx: number
  ) => {
    selModeRef.current = "REPLACE";
    if (e.ctrlKey || e.metaKey) selModeRef.current = "ADD";
    else if (e.shiftKey) selModeRef.current = "REMOVE";
    else if (selSet.has(pivotIdx)) selModeRef.current = "NONE";
    return selModeRef.current;
  };

  const getSelMode = selModeRef.current;

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

  const selTreeSbjDrag = (b: boolean) => {
    setTreeSbjDrag(selSet.size === 0 ? false : b);
  };
  const selTreeCrsDrag = (i: number) => {
    const trg = getItemByIdx(sbjList, i);
    if (!trg || trg.sbjType === "Subject") return;
    setTreeCrsDrag(i);
  };

  const selCnvsSbjDrag = (b: boolean) => {
    setCnvsSbjDrag(selSet.size === 0 ? false : b);
  };
  const selCnvsCrsDrag = (i: number) => {
    const trg = getItemByIdx(sbjList, i);
    if (!trg || trg.sbjType === "Subject") return;
    setCnvsCrsDrag(i);
  };

  const clearTreeDrag = () => {
    setTreeCrsDrag(-1);
    setTreeSbjDrag(false);
  };

  const clearCnvsDrag = () => {
    setCnvsSbjDrag(false);
    setCnvsCrsDrag(-1);
  };

  const setSbjPos = (dxy: { x: number; y: number }) => {
    setSbjList((prev) => setSubjectXY(prev, selSet, dxy).newList);
  };

  return {
    isTreeDrag: treeSbjDrag === true || treeCrsDrag >= 0,
    isCnvsDrag: cnvsSbjDrag === true || cnvsCrsDrag >= 0,
    sbjList,
    selSet,
    addSbj,
    addCrs,
    clearCnvsDrag,
    clearTreeDrag,
    delSbj,
    delCrs,
    getSelMode,
    setSbjBro,
    setSbjMom,
    setSbjPos,
    setSelMode,
    selCnvsSbjDrag,
    selCnvsCrsDrag,
    selSbj,
    selTreeCrsDrag,
    selTreeSbjDrag,
  };
};
