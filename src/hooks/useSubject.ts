import { useState } from "react";
import { DefCrs, type Course } from "../types/Course";
import { DefSbj, type Subject } from "../types/Subject";
import { getNewIdx, itemByIdx } from "../utils/idxOperation";
import { useSelect } from "./useSelect";

export const useSubject = () => {
  const [crsList, setCrsList] = useState<Course[]>([]);
  const [sbjList, setSbjList] = useState<Subject[]>([]);
  const { slcSet, select } = useSelect();

  const addSbj = () => {
    const i = getNewIdx(sbjList);
    setSbjList((pSbjList) => [...pSbjList, DefSbj(i)]);
    select("REPLACE", i);
  };

  const delSbj = () => {
    setSbjList((pSbjList) => pSbjList.filter((sbj) => !slcSet.has(sbj.idx)));
    select("REPLACE");
  };

  const addCrs = () => {
    const i = getNewIdx(crsList);
    setCrsList((pCrsList) => [...pCrsList, DefCrs(i)]);
    select("REPLACE");
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
      setSbjList((pSbjList) =>
        pSbjList.map((sbj) => (sbj.mom === i ? { ...sbj, mom: nMom } : sbj))
      );
    }
    select("REPLACE");
  };

  return { crsList, sbjList, addSbj, delSbj, addCrs, delCrs, slcSet, select };
};
