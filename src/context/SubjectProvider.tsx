import { createContext, useContext, type ReactNode } from "react";
import { useCurriculum } from "../hooks/useCurriculum";

type SubjectContextValue = ReturnType<typeof useCurriculum>;
const SubjectContext = createContext<SubjectContextValue | null>(null);

export function SubjectProvider({ children }: { children: ReactNode }) {
  const S = useCurriculum();
  return (
    <SubjectContext.Provider value={S}>{children}</SubjectContext.Provider>
  );
}

export function useSubjectStore() {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error("useCourse가 CourseProvider 내에 있지 않습니다.");
  }
  return context;
}
