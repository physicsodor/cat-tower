import { useCallback } from "react";

export const useSbjSelection = (
  slcSet: ReadonlySet<number>,
  setSlcSet: React.Dispatch<React.SetStateAction<Set<number>>>
) => {
  const slcSbj = useCallback(
    (e: PointerEvent | React.PointerEvent, idx: number) => {
      let s = new Set(slcSet);
      if (e.ctrlKey) s.add(idx);
      else if (e.shiftKey) s.delete(idx);
      else if (!slcSet.has(idx)) s = new Set([idx]);
      setSlcSet(s);
      return s;
    },
    [slcSet, setSlcSet]
  );

  return { slcSbj };
};
