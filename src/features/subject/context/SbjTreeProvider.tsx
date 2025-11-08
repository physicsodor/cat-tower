import { type ReactNode } from "react";
import { useSbjTree } from "../hooks/useSbjTree";
import { SbjTreeContext } from "./SbjTreeContext";
import { useSbjStore } from "./SbjContext";

export const SbjTreeProvider = ({ children }: { children: ReactNode }) => {
  const { idx2family, setList } = useSbjStore();
  const S = useSbjTree(idx2family, setList);
  return (
    <SbjTreeContext.Provider value={S}>{children}</SbjTreeContext.Provider>
  );
};
