import { useCallback } from "react";
import type { Curriculum } from "@/lib/Curriculum/curriculum";
import { setBro, setMom, exitMom } from "@/lib/Family/familyOp";
import type { BroDir, FamilyMap } from "@/lib/Family/family";
import type { GetSet } from "@/utils/GetSet";

export const useSbjTree = (
  idx2family: FamilyMap,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  treeDrag: GetSet<Set<number>>
) => {
  const setTreeMom = useCallback(
    (trg: ReadonlySet<number>, mom: number) => {
      const { updater } = setMom<Curriculum>(idx2family, trg, mom);
      setList(updater);
      treeDrag.set(new Set());
    },
    [idx2family, setList, treeDrag]
  );

  const setTreeBro = useCallback(
    (trg: ReadonlySet<number>, idx: number, dir: BroDir) => {
      const { updater } = setBro<Curriculum>(idx2family, trg, idx, dir);
      setList(updater);
      treeDrag.set(new Set());
    },
    [idx2family, setList, treeDrag]
  );

  const exitTreeMom = useCallback(
    (trg: ReadonlySet<number>) => {
      const { updater } = exitMom<Curriculum>(idx2family, trg);
      setList(updater);
    },
    [idx2family, setList]
  );

  return { setTreeMom, setTreeBro, exitTreeMom };
};
