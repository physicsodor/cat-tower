import { useMemo } from "react";
import { buildSbjMap } from "@/features/subject/utils/curriculumOp";
import { buildFamilyMap } from "@/features/subject/utils/familyOp";
import { buildChainMap } from "@/features/subject/utils/chainOp";
import type { Curriculum } from "@/features/subject/types/Curriculum";

export const useSbjDerived = (list: ReadonlyArray<Curriculum>) => {
  const idx2sbj = useMemo(() => buildSbjMap(list), [list]);
  const idx2family = useMemo(() => buildFamilyMap(list), [list]);
  const idx2chain = useMemo(() => buildChainMap(list), [list]);
  return { idx2sbj, idx2family, idx2chain };
};
