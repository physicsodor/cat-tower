import { useState } from "react";
import { type Course, type Subject } from "../types/Subject";
import type { SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOp";
import { getItemByIdx } from "../utils/idxItemOp";
import { getNewBro } from "../utils/familyOp";
import { addCourse, addSubject } from "../utils/subjectOp";

export const useSubject = () => {
  const [sbjList, setSbjList] = useState<(Subject | Course)[]>([]);
  const [slcSet, setSlcSet] = useState<Set<number>>(new Set());
  const [crsDrag, setCrsDrag] = useState(-1);

  /** Add a Subject or a */
  const addSbj = () => setSbjList((prev) => addSubject(prev));
  const addCrs = () => setSbjList((prev) => addCourse(prev));

  /** Delete the selected Subjects. */
  const deleteSbj = () => {
    setSbjList((prev) => {
      const broMap = new Map<number, number>();
      for (const x of prev) broMap.set(x.idx, x.bro);
      return prev
        .filter((sbj) => !slcSet.has(sbj.idx) || sbj.isMom)
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
    if (!trg || !trg.isMom) return;

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
        return trg ? !trg.isMom : false;
      })
    );
    if (mode === "ADD") setSlcSet((prev) => setUni(prev, idxSet));
    else if (mode === "REPLACE") setSlcSet(idxSet);
    else if (mode === "REMOVE") setSlcSet((prev) => setDif(prev, idxSet));
  };

  /** Set mom of the selected Subjects to nMom. */
  const setSbjMom = (nMom: number) => {
    if (slcSet.size === 0) return;
    const momCrs = getItemByIdx(sbjList, nMom);
    if (!momCrs || !momCrs.isMom) return;

    setSbjList((prev) => {
      const sbjMap = new Map(prev.map((x) => [x.idx, x] as const));
      const slcList = prev.filter((sbj) => slcSet.has(sbj.idx));
      const broMap = new Map<number, number>();
      for (const x of slcList) {
        let b = x.bro;
        while (slcSet.has(b) && b >= 0) {
          b = sbjMap.get(b)?.bro ?? -1;
        }
        broMap.set(x.idx, b);
      }

      let nBro = getNewBro(prev, nMom, slcSet);

      return prev.map((sbj) => {
        if (slcSet.has(sbj.idx) && !sbj.isMom) {
          const nSbj = { ...sbj, mom: nMom, bro: nBro };
          nBro = sbj.idx;
          return nSbj;
        }
        if (slcSet.has(sbj.bro)) {
          return { ...sbj, bro: broMap.get(sbj.bro) ?? -1 };
        }
        return sbj;
      });
    });
  };

  /** Set mom of the Course by idx to nMom. */
  const setCrsMom = (nMom: number) => {
    const trg = getItemByIdx(sbjList, crsDrag);
    if (!trg || !trg.isMom) return;

    let momSbj = getItemByIdx(sbjList, nMom);
    if (!momSbj || !momSbj.isMom) return;

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
    if (!trg || !trg.isMom) return;
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
