import { type ReactNode } from "react";
import { useCurriculum } from "../hooks/useCurriculum";
import { CurriculumContext } from "./CurriculumContext";

export const CurriculumProvider = ({ children }: { children: ReactNode }) => {
  const S = useCurriculum();
  return (
    <CurriculumContext.Provider value={S}>
      {children}
    </CurriculumContext.Provider>
  );
};
