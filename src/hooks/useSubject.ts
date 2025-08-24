import { useCallback, useState } from "react";
import { DefSbj, type Subject } from "../types/Subject";
import { getNewIdx, itemByIdx } from "../utils/idxOperation";
import type { SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOperation";
import { DefCrs, type Course } from "../types/Course";

export const useSubject = () => {
  const [sbjList, setSbjList] = useState<Subject[]>([]);
  const [slcSet, setSlcSet] = useState<Set<number>>(new Set());
  const [crsList, setCrsList] = useState<Course[]>([]);
  const [crsDrg, setCrsDrg] = useState<number>(-1);

  /** Add a Subject. */
  const addSbj = () => {
    const i = getNewIdx(sbjList);
    setSbjList((prev) => [...prev, DefSbj(i)]);
    slcSbj("REPLACE", i);
  };

  /** Delete the Subjects in trgSet. */
  const delSbj = () => {
    setSbjList((prev) => prev.filter((sbj) => !slcSet.has(sbj.idx)));
    slcSbj("REPLACE");
  };

  /** Set mom of the Subjects in trgSet as nMom. */
  const setSbjMom = (nMom: number) => {
    setSbjList((prev) =>
      prev.map((sbj) => (slcSet.has(sbj.idx) ? { ...sbj, mom: nMom } : sbj))
    );
  };

  /** Fix mom of the Subjects whose mom was pMom as nMom. */
  const fixSbjMom = (pMom: number, nMom: number) => {
    setSbjList((prev) =>
      prev.map((sbj) => (sbj.mom === pMom ? { ...sbj, mom: nMom } : sbj))
    );
  };

  /** Select Subjects by idxList */
  const slcSbj = useCallback((mode: SelectMode, ...idxList: number[]) => {
    const idxSet = new Set(idxList);
    if (mode === "ADD") {
      setSlcSet((prev) => setUni(prev, idxSet));
    } else if (mode === "REPLACE") {
      setSlcSet(idxSet);
    } else if (mode === "REMOVE") {
      setSlcSet((prev) => setDif(prev, idxSet));
    }
  }, []);

  /** Add a Course */
  const addCrs = () => {
    const i = getNewIdx(crsList);
    setCrsList((prev) => [...prev, DefCrs(i)]);
    slcSbj("REPLACE");
  };

  /** Delete a Course by idx */
  const delCrs = (idx: number) => () => {
    const trg = itemByIdx(crsList, idx);
    if (!trg) return undefined;

    const nMom = itemByIdx(crsList, trg.mom)?.mom || -1;
    setCrsList((prev) =>
      prev
        .filter((crs) => crs.idx !== idx)
        .map((crs) => (crs.mom === idx ? { ...crs, mom: nMom } : crs))
    );
    fixSbjMom(idx, nMom);
    slcSbj("REPLACE");
  };

  const setCrsMom = (nMom: number) => {
    const visited: Set<number> = new Set([crsDrg]);
    let target: Course | undefined = itemByIdx(crsList, nMom);

    while (true) {
      if (!target || visited.has(target.idx)) break;
      if (target.mom === -1) {
        setCrsList((prev) =>
          prev.map((crs) => (crs.idx === crsDrg ? { ...crs, mom: nMom } : crs))
        );
        break;
      }
      target = itemByIdx(crsList, target.mom);
    }
    setCrsDrg(-1);
  };
  const addCrsDrg = (idx: number) => setCrsDrg(idx);
  const delCrsDrg = () => setCrsDrg(-1);

  return {
    addCrs,
    addCrsDrg,
    addSbj,
    crsList,
    delCrs,
    delSbj,
    sbjList,
    slcSbj,
    slcSet,
    setCrsMom,
  };
};
