import { useCallback } from "react";
import type {
  Course,
  Curriculum,
  Subject,
} from "@/features/subject/types/Curriculum";
import { setPre, type ChainMap } from "@/features/subject/utils/chainOp";
import type { GetSet } from "@/types/GetSet";

export const useSbjCnvs = (
  idx2chain: ChainMap,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  preFrom: GetSet<number>
) => {
  const setCnvsPre = useCallback(
    (idx: number) => {
      const { updator } = setPre<Subject, Course>(
        idx2chain,
        preFrom.get(),
        idx
      );
      setList(updator);
      preFrom.set(-1);
    },
    [idx2chain, setList, preFrom]
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
