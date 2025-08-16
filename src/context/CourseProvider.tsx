import { createContext, useContext, type ReactNode } from "react";
import { useCourse } from "../hooks/useCourse";

type CourseContextValue = ReturnType<typeof useCourse>;
const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ children }: { children: ReactNode }) {
  const S = useCourse();
  return <CourseContext.Provider value={S}>{children}</CourseContext.Provider>;
}

export function useCourseStore() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourse가 CourseProvider 내에 있지 않습니다.");
  }
  return context;
}
