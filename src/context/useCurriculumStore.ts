import { useContext } from "react";
import { CurriculumContext } from "./CurriculumContext";

export const useCurriculumStore = () => {
  const context = useContext(CurriculumContext);
  if (!context) {
    throw new Error("Store가 provider 내에 있지 않습니다.");
  }
  return context;
};
