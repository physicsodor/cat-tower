import { useContext } from "react";
import { SubjectContext } from "./SubjectContext";

export const useSubjectStore = () => {
  const context = useContext(SubjectContext);
  if (!context) throw new Error("Store가 provider 내에 있지 않습니다.");
  return context;
};
