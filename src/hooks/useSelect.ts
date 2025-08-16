import { useCallback, useState } from "react";
import type { SelectMode } from "../types/SelectMode";
import { setDif, setUni } from "../utils/setOperation";

export const useSelect = () => {
  const [slcSet, setSlcSet] = useState<Set<number>>(new Set());

  const select = useCallback((mode: SelectMode, ...idxList: number[]) => {
    const idxSet = new Set(idxList);
    if (mode === "ADD") {
      setSlcSet((prev) => setUni(prev, idxSet));
    } else if (mode === "REPLACE") {
      setSlcSet(idxSet);
    } else if (mode === "REMOVE") {
      setSlcSet((prev) => setDif(prev, idxSet));
    }
  }, []);

  return { slcSet, select };
};
