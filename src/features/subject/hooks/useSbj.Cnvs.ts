import { useCallback } from "react";
import type {
  Course,
  Curriculum,
  Subject,
} from "@/features/subject/types/Curriculum/Curriculum";
import { setPre, type ChainMap } from "@/features/subject/types/Chain/chainOp";
import type { GetSet } from "@/types/GetSet";

export const useSbjCnvs = (
  idx2chain: ChainMap,
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

  return { setCnvsPre, setCnvsPos };
};
