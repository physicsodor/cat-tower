import { useState } from "react";
import { DefCrs, type Course } from "../types/Course";
import { useSubject } from "./useSubject";
import { getNewIdx, itemByIdx } from "../utils/idxOperation";

export const useCourse = () => {
  const [crsList, setCrsList] = useState<Course[]>([]);
  const S = useSubject();

  const addCrs = () => {
    const i = getNewIdx(crsList);
    setCrsList((pCrsList) => [...pCrsList, DefCrs(i)]);
    S.select("REPLACE");
  };

  const delCrs = (i: number) => () => {
    const mom = itemByIdx(crsList, crsList[i].mom);
    if (mom) {
      const nMom = mom.mom;
      setCrsList((pCrsList) =>
        pCrsList
          .filter((crs) => crs.idx !== i)
          .map((crs) => (crs.mom === i ? { ...crs, mom: nMom } : crs))
      );
      S.fixSbjMom(i, nMom);
    }
    S.select("REPLACE");
  };

  return { crsList, addCrs, delCrs, ...S };
};
