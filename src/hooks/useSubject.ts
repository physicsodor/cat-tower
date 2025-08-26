import { useState } from "react";
import { DefSbj, type Subject } from "../types/Subject";
import { getNewIdx, getItemByIdx, getNewBro } from "../utils/familyOperation";
import type { SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOperation";
import { DefCrs, isCourse, type Course } from "../types/Course";

export const useSubject = () => {
  const [sbjList, setSbjList] = useState<(Subject | Course)[]>([]);
  const [slcSet, setSlcSet] = useState<Set<number>>(new Set());
  const [crsDrag, setCrsDrag] = useState(-1);

  /** Add a Subject. */
  const addSbj = () => {
    setSbjList((prev) => {
      const i = getNewIdx(prev);
      const b = getNewBro(prev);
      selectSbj("REPLACE", i);
      return [...prev, DefSbj(i, b)];
    });
  };

  /** Add a Course */
  const addCrs = () => {
    setSbjList((prev) => {
      const i = getNewIdx(prev);
      const b = getNewBro(prev);
      selectSbj("REPLACE", i);
      return [...prev, DefCrs(i, b)];
    });
  };

  /** Delete the selected Subjects. */
  const deleteSbj = () => {
    setSbjList((prev) => {
      const broMap = new Map<number, number>();
      for (const x of prev) broMap.set(x.idx, x.bro);
      return prev
        .filter((sbj) => !slcSet.has(sbj.idx) || isCourse(sbj))
        .map((sbj) =>
          slcSet.has(sbj.bro)
            ? { ...sbj, bro: broMap.get(sbj.bro) as number }
            : sbj
        );
    });
    selectSbj("REPLACE");
  };

  /** Delete the Course by idx */
  const deleteCrs = (idx: number) => () => {
    const trg = getItemByIdx(sbjList, idx);
    if (!trg || !isCourse(trg)) return;

    setSbjList((prev) =>
      prev
        .filter((crs) => crs.idx !== idx)
        .map((sbj) =>
          sbj.mom === idx
            ? { ...sbj, mom: trg.mom }
            : sbj.bro === idx
            ? { ...sbj, bro: trg.bro }
            : sbj
        )
    );
  };

  /** Select Subjects by idxList */
  const selectSbj = (mode: SelectMode, ...idxList: number[]) => {
    const idxSet = new Set(
      idxList.filter((idx) => {
        const trg = getItemByIdx(sbjList, idx);
        return trg ? !isCourse(trg) : false;
      })
    );
    if (mode === "ADD") {
      setSlcSet((prev) => setUni(prev, idxSet));
    } else if (mode === "REPLACE") {
      setSlcSet(idxSet);
    } else if (mode === "REMOVE") {
      setSlcSet((prev) => setDif(prev, idxSet));
    }
  };

  /** Set mom of the selected Subjects to nMom. */
  const setSbjMom = (nMom: number) => {
    if (slcSet.size === 0) return;
    const momCrs = getItemByIdx(sbjList, nMom);
    if (!momCrs || !isCourse(momCrs)) return;

    setSbjList((prev) => {
      const broList = prev.filter((sbj) => slcSet.has(sbj.idx));
      const broMap = new Map<number, number>();
      for (const x of broList) {
        let b = x.bro;
        while (slcSet.has(b) && b >= 0) {
          b = broList.find((sbj) => sbj.idx === b)?.bro ?? -1;
        }
        broMap.set(x.idx, b);
      }
      let nBro = getNewBro(prev, nMom);
      return prev.map((sbj) => {
        let nSbj: Subject | Course;
        if (slcSet.has(sbj.idx) && !isCourse(sbj)) {
          nSbj = { ...sbj, mom: nMom, bro: nBro };
          nBro = sbj.idx;
        } else if (slcSet.has(sbj.bro)) {
          nSbj = { ...sbj, bro: broMap.get(sbj.bro) ?? -1 };
        } else nSbj = sbj;
        return nSbj;
      });
    });
  };

  /** Set mom of the Course by idx to nMom. */
  const setCrsMom = (nMom: number) => {
    const trg = getItemByIdx(sbjList, crsDrag);
    if (!trg || !isCourse(trg)) return;

    let momSbj = getItemByIdx(sbjList, nMom);
    if (!momSbj || !isCourse(momSbj)) return;

    const visited = new Set([nMom]);
    while (momSbj && momSbj.mom >= -1 && !visited.has(momSbj.mom)) {
      visited.add(momSbj.mom);
      momSbj = getItemByIdx(sbjList, momSbj.mom);
    }
    if (visited.has(crsDrag)) return;

    setSbjList((prev) =>
      prev.map((sbj) =>
        sbj.idx === crsDrag
          ? { ...sbj, mom: nMom, bro: getNewBro(prev, nMom) }
          : sbj.bro === crsDrag
          ? { ...sbj, bro: trg.bro }
          : sbj
      )
    );
  };

  const selectCrsDrag = (i: number) => {
    const trg = getItemByIdx(sbjList, i);
    if (!trg || !isCourse(trg)) return;
    setCrsDrag(i);
  };

  return {
    sbjList,
    slcSet,
    crsDrag,
    addSbj,
    addCrs,
    deleteSbj,
    deleteCrs,
    selectCrsDrag,
    selectSbj,
    setCrsMom,
    setSbjMom,
  };
};
