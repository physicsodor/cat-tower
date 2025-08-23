import { useState } from "react";
import { DefCrs, type Course } from "../types/Course";
import { useSubject } from "./useSubject";
import { getNewIdx, itemByIdx } from "../utils/idxOperation";

export const useCourse = () => {
  const [crsList, setCrsList] = useState<Course[]>([]);
  const [crsDrg, setCrsDrg] = useState<number>(-1);
  const S = useSubject();

  const addCrs = () => {
    const i = getNewIdx(crsList);
    setCrsList((prev) => [...prev, DefCrs(i)]);
    S.select("REPLACE");
  };

  const delCrs = (idx: number) => () => {
    const trg = itemByIdx(crsList, idx);
    if (!trg) return undefined;

    const nMom = itemByIdx(crsList, trg.mom)?.mom || -1;
    setCrsList((prev) =>
      prev
        .filter((crs) => crs.idx !== idx)
        .map((crs) => (crs.mom === idx ? { ...crs, mom: nMom } : crs))
    );
    S.fixSbjMom(idx, nMom);
    S.select("REPLACE");
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
    crsList,
    addCrs,
    delCrs,
    ...S,
    setCrsMom,
    crsDrg,
    addCrsDrg,
    delCrsDrg,
  };
};
