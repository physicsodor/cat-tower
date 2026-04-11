import { type Dispatch, type SetStateAction, useCallback } from "react";
import type { SpeciesType } from "@/lib/Species/species";
import { DEFAULT_SPC_IDX } from "@/lib/Species/species";
import type { Curriculum } from "@/lib/Curriculum/curriculum";
import {
  addSpeciesType as addSpcFn,
  updateSpeciesType as updateSpcFn,
} from "@/lib/Species/speciesOp";

export const useSpeciesCrud = (
  setSpcTypes: Dispatch<SetStateAction<SpeciesType[]>>,
  setList: Dispatch<SetStateAction<ReadonlyArray<Curriculum>>>,
) => {
  const addSpcType = useCallback(() => {
    setSpcTypes((prev) => addSpcFn(prev, { title: "", prefix: "", number: "NONE" }));
  }, [setSpcTypes]);

  const removeSpcType = useCallback(
    (spcIdx: number) => {
      if (spcIdx === DEFAULT_SPC_IDX) return;
      setSpcTypes((prev) => prev.filter((s) => s.idx !== spcIdx));
      setList((prev) =>
        prev.map((item) => {
          if (item.sbjType !== "SUBJECT" || item.spc !== spcIdx) return item;
          return { ...item, spc: DEFAULT_SPC_IDX };
        }),
      );
    },
    [setSpcTypes, setList],
  );

  const updateSpcType = useCallback(
    (spcIdx: number, patch: Partial<Omit<SpeciesType, "idx">>) => {
      const { updater } = updateSpcFn(spcIdx, patch);
      setSpcTypes(updater);
    },
    [setSpcTypes],
  );

  const setSpc = useCallback(
    (targetSet: ReadonlySet<number>, spcIdx: number) => {
      setList((prev) =>
        prev.map((item) => {
          if (item.sbjType !== "SUBJECT" || !targetSet.has(item.idx)) return item;
          return { ...item, spc: spcIdx };
        }),
      );
    },
    [setList],
  );

  return { addSpcType, removeSpcType, updateSpcType, setSpc };
};
