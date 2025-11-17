import { useCallback } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum";
import {
  setBro,
  setMom,
  type BroDir,
  type FamilyMap,
} from "@/features/subject/utils/familyOp";
import type { GetSet } from "@/types/GetSet";

export const useSbjTree = (
  idx2family: FamilyMap,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  treeDrag: GetSet<Set<number>>
) => {
  const setTreeMom = useCallback(
    (trg: Set<number>, mom: number) => {
      const { updator } = setMom<Curriculum>(idx2family, trg, mom);
      setList(updator);
      treeDrag.set(new Set());
    },
    [idx2family, setList, treeDrag]
  );

  const setTreeBro = useCallback(
    (trg: Set<number>, idx: number, dir: BroDir) => {
      const { updator } = setBro<Curriculum>(idx2family, trg, idx, dir);
      setList(updator);
      treeDrag.set(new Set());
    },
    [idx2family, setList, treeDrag]
  );

  return { setTreeMom, setTreeBro };
};
