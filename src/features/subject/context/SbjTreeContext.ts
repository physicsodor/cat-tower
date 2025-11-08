import { createContext, useContext } from "react";
import type { useSbjTree } from "../hooks/useSbjTree";

type SbjTreeContextValue = ReturnType<typeof useSbjTree>;
export const SbjTreeContext = createContext<SbjTreeContextValue | null>(null);

export const useSbjTreeStore = () => {
  const context = useContext(SbjTreeContext);
  if (!context) throw new Error("Store가 provider에 포함되지 않았습니다.");
  return context;
};
