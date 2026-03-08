import { createContext, useContext } from "react";
import type { useSbjSync } from "../hooks/useSbj.Sync";

type SbjSyncContextValue = ReturnType<typeof useSbjSync>;

export const SbjSyncContext = createContext<SbjSyncContextValue | null>(null);

export const useSbjSyncStore = () => {
  const ctx = useContext(SbjSyncContext);
  if (!ctx) throw new Error("SbjSyncContext가 Provider에 포함되지 않았습니다.");
  return ctx;
};
