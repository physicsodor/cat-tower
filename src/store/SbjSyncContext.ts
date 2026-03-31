import { createContext, useContext } from "react";
import type { useSbjSync } from "@/hooks/useSbjSync";

type SbjSyncContextValue = ReturnType<typeof useSbjSync>;

export const SbjSyncContext = createContext<SbjSyncContextValue | null>(null);

export const useSbjSyncCtx = () => {
  const ctx = useContext(SbjSyncContext);
  if (!ctx) throw new Error("SbjSyncContext가 Provider에 포함되지 않았습니다.");
  return ctx;
};
