import { useCallback } from "react";
import type {
  Course,
  Curriculum,
  Subject,
} from "@/features/subject/types/Curriculum/Curriculum";
import { setPre, type ChainMap } from "@/features/subject/types/Chain/chainOp";
import type { FamilyMap } from "@/features/subject/types/Family/familyOp";
import type { GetSet } from "@/utils/GetSet";
import { computeAutoLayout } from "@/features/subject/utils/autoLayout";

export const useSbjCnvs = (
  list: ReadonlyArray<Curriculum>,
  idx2chain: ChainMap,
  idx2family: FamilyMap,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  preSource: GetSet<number>
) => {
  const setCnvsPre = useCallback(
    (idx: number) => {
      const { updater } = setPre<Subject, Course>(
        idx2chain,
        preSource.get(),
        idx
      );
      setList(updater);
      preSource.set(-1);
    },
    [idx2chain, setList, preSource]
  );

  const setCnvsPos = (
    trg: Set<number>,
    { dx, dy }: { dx: number; dy: number }
  ) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.sbjType === "COURSE" || !trg.has(item.idx)) return item;
        return { ...item, x: item.x + dx, y: item.y + dy };
      })
    );
  };

  const autoLayout = useCallback((sizes?: Map<number, { w: number; h: number }>) => {
    const positions = computeAutoLayout(list, idx2chain, idx2family, sizes);
    setList((prev) =>
      prev.map((item) => {
        if (item.sbjType === "COURSE") return item;
        const pos = positions.get(item.idx);
        if (!pos) return item;
        return { ...item, x: pos.x, y: pos.y };
      })
    );
  }, [list, idx2chain, idx2family, setList]);

  return { setCnvsPre, setCnvsPos, autoLayout };
};
