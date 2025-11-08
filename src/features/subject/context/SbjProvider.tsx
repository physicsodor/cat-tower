import { type ReactNode } from "react";
import { SbjContext } from "./SbjContext";
import { useSbj } from "@/features/subject/hooks/useSbj";

export const SbjProvider = ({ children }: { children: ReactNode }) => {
  const S = useSbj();
  return <SbjContext.Provider value={S}>{children}</SbjContext.Provider>;
};
