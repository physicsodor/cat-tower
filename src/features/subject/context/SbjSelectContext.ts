import { createContext, useContext } from "react";

type SbjSelectContextValue = {
  selectedSet: ReadonlySet<number>;
  selectItem: (
    e: PointerEvent | React.PointerEvent,
    idx: number
  ) => Set<number>;
};

export const SbjSelectContext =
  createContext<SbjSelectContextValue | null>(null);

export const useSbjSelect = () => {
  const ctx = useContext(SbjSelectContext);
  if (!ctx) throw new Error("SbjSelectContext가 Provider에 포함되지 않았습니다.");
  return ctx;
};
