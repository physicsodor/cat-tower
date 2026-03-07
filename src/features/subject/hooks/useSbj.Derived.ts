import { useMemo } from "react";
import { buildSbjMap } from "@/features/subject/types/Curriculum/curriculumOp";
import { buildFamilyMap } from "@/features/subject/types/Family/familyOp";
import { buildChainMap } from "@/features/subject/types/Chain/chainOp";
import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";

export const useSbjDerived = (list: ReadonlyArray<Curriculum>) => {
  const idx2sbj = useMemo(() => buildSbjMap(list), [list]);
  const idx2family = useMemo(() => buildFamilyMap(list), [list]);
  const idx2chain = useMemo(() => buildChainMap(list), [list]);
  return { idx2sbj, idx2family, idx2chain };
};
