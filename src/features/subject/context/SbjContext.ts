import { createContext, useContext } from "react";
import type { useSbj } from "@/features/subject/hooks/useSbj";

type SbjContextValue = ReturnType<typeof useSbj>;
export const SbjContext = createContext<SbjContextValue | null>(null);

export const useSbjStore = () => {
  const context = useContext(SbjContext);
  if (!context) throw new Error("Store가 provider에 포함되지 않았습니다.");
  return context;
};
