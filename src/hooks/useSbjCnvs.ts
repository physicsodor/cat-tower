import { useCallback } from "react";
import type {
  Course,
  Curriculum,
  Subject,
} from "@/lib/Curriculum/curriculum";
import { setPre } from "@/lib/Chain/chainOp";
import type { ChainMap } from "@/lib/Chain/chain";
import type { GetSet } from "@/utils/GetSet";
import { computeAutoLayout } from "@/utils/autoLayout";
import type { BBox } from "@/lib/BBox/bbox";

export const useSbjCnvs = (
  idx2chain: ChainMap,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  preSource: GetSet<number>,
) => {
  const setCnvsPre = useCallback(
    (idx: number) => {
      const { updater } = setPre<Subject, Course>(
        idx2chain,
        preSource.get(),
        idx,
      );
      setList(updater);
      preSource.set(-1);
    },
    [idx2chain, setList, preSource],
  );

  const setCnvsPos = (
    trg: Set<number>,
    { dx, dy }: { dx: number; dy: number },
  ) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.sbjType === "COURSE" || !trg.has(item.idx)) return item;
        return { ...item, x: item.x + dx, y: item.y + dy };
      }),
    );
  };

  const autoLayout = useCallback(
    (bboxMap: Map<number, BBox>) => {
      const positions = computeAutoLayout(idx2chain, bboxMap);
      setList((prev) =>
        prev.map((item) => {
          if (item.sbjType === "COURSE") return item;
          const pos = positions.get(item.idx);
          if (!pos) return item;
          return { ...item, x: pos.x, y: pos.y };
        }),
      );
    },
    [idx2chain, setList],
  );

  return { setCnvsPre, setCnvsPos, autoLayout };
};
