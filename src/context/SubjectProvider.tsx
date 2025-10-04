import { type ReactNode } from "react";
import { SubjectContext } from "./SubjectContext";
import { useSubject } from "../hooks/useSubject";

export const SubjectProvider = ({ children }: { children: ReactNode }) => {
  const S = useSubject();
  return (
    <SubjectContext.Provider value={S}>{children}</SubjectContext.Provider>
  );
};
