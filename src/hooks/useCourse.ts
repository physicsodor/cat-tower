import { useState } from "react";
import { DefCrs, type Course } from "../types/Course";
import { useSubject } from "./useSubject";
import { getNewIdx, itemByIdx } from "../utils/idxOperation";

export const useCourse = () => {
  const [crsList, setCrsList] = useState<Course[]>([]);
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

  return { crsList, addCrs, delCrs, ...S };
};
