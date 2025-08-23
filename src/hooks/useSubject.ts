import { useState } from "react";
import { DefSbj, type Subject } from "../types/Subject";
import { getNewIdx } from "../utils/idxOperation";
import { useSelect } from "./useSelect";

export const useSubject = () => {
  const [sbjList, setSbjList] = useState<Subject[]>([]);
  const S = useSelect();

  const addSbj = () => {
    const i = getNewIdx(sbjList);
    setSbjList((prev) => [...prev, DefSbj(i)]);
    S.select("REPLACE", i);
  };

  const delSbj = () => {
    setSbjList((prev) => prev.filter((sbj) => !S.slcSet.has(sbj.idx)));
    S.select("REPLACE");
  };

  const setSbjMom = (nMom: number) => {
    setSbjList((prev) =>
      prev.map((sbj) => (S.slcSet.has(sbj.idx) ? { ...sbj, mom: nMom } : sbj))
    );
  };

  const fixSbjMom = (pMom: number, nMom: number) => {
    setSbjList((prev) =>
      prev.map((sbj) => (sbj.mom === pMom ? { ...sbj, mom: nMom } : sbj))
    );
  };

  return {
    sbjList,
    addSbj,
    delSbj,
    setSbjMom,
    fixSbjMom,
    ...S,
  };
};
