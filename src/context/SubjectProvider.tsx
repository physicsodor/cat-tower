import { createContext, useContext, type ReactNode } from "react";
import { useSubject } from "../hooks/useSubject";

type SubjectContextValue = ReturnType<typeof useSubject>;
const SubjectContext = createContext<SubjectContextValue | null>(null);

export function SubjectProvider({ children }: { children: ReactNode }) {
  const S = useSubject();
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
