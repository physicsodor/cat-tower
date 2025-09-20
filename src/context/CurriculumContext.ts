import { createContext } from "react";
import type { useCurriculum } from "../hooks/useCurriculum";

type CurriculumContextValue = ReturnType<typeof useCurriculum>;
export const CurriculumContext = createContext<CurriculumContextValue | null>(
  null
);
