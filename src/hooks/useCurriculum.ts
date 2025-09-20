import React, { useCallback, useMemo, useRef, useState } from "react";
import { type Curriculum } from "../types/Curriculum";
import { type SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOp";
import { setBro, setFamilyMom } from "../utils/familyOp";
import {
  deleteCurriculum,
  newCourse,
  newSubject,
  setSubjectXY,
} from "../utils/curriculumOp";
import type { InsertMode } from "../types/InsertMode";
import { getItemByIdx } from "../utils/idxItemOp";

export const useCurriculum = () => {
  const [sbjList, setSbjList] = useState<Curriculum[]>([]);
  const [selSet, setSelSet] = useState<Set<number>>(new Set());
  const [treeSbjDrag, setTreeSbjDrag] = useState(false);
  const [treeCrsDrag, setTreeCrsDrag] = useState(-1);
  const [cnvsSbjDrag, setCnvsSbjDrag] = useState(false);
  const [cnvsCrsDrag, setCnvsCrsDrag] = useState(-1);
  const selModeRef = useRef<SelectMode>("NONE");

  const addSbj = useCallback(() => {
    let newIdx: number = -1;
    setSbjList((prev) => {
      const newItem = newSubject(prev);
      newIdx = newItem.idx;
      return [...prev, newItem];
    });
    setSelSet(new Set([newIdx]));
  }, []);

  const addCrs = useCallback(() => {
    setSbjList((prev) => [...prev, newCourse(prev)]);
  }, []);

  const delSbj = useCallback(() => {
    setSbjList((prev) => deleteCurriculum(prev, selSet));
    setSelSet(new Set());
  }, [selSet]);

  const delCrsByIdx = useCallback(
    (idx: number) => () =>
      setSbjList((prev) => deleteCurriculum(prev, new Set([idx]))),
    []
  );

  const treeTarget = useMemo(
    () =>
      treeCrsDrag >= 0
        ? new Set([treeCrsDrag])
        : treeSbjDrag
        ? selSet
        : new Set<number>(),
    [selSet, treeCrsDrag, treeSbjDrag]
  );

  const clearTreeTarget = useCallback(() => {
    setTreeCrsDrag(-1);
    setTreeSbjDrag(false);
  }, []);

  const setSbjMom = useCallback(
    (mom: number) => {
      if (treeTarget.size === 0) return;
      setSbjList((prev) => setFamilyMom(prev, treeTarget, mom));
      clearTreeTarget();
    },
    [treeTarget, clearTreeTarget]
  );

  const setSbjBro = useCallback(
    (pivotIdx: number, dir: InsertMode) => {
      if (treeTarget.size === 0) return;
      setSbjList((prev) => setBro(prev, treeTarget, pivotIdx, dir));
      clearTreeTarget();
    },
    [clearTreeTarget, treeTarget]
  );

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
        return trg && trg.sbjType === "SUBJECT";
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
    if (!trg || trg.sbjType === "SUBJECT") return;
    setTreeCrsDrag(i);
  };

  const selCnvsSbjDrag = (b: boolean) => {
    setCnvsSbjDrag(selSet.size === 0 ? false : b);
  };
  const selCnvsCrsDrag = (i: number) => {
    const trg = getItemByIdx(sbjList, i);
    if (!trg || trg.sbjType === "SUBJECT") return;
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
    delCrs: delCrsByIdx,
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
