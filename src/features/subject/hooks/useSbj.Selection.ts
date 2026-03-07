import { useCallback } from "react";

export const useSbjSelection = (
  selectedSet: ReadonlySet<number>,
  setSelectedSet: React.Dispatch<React.SetStateAction<Set<number>>>
) => {
  const selectItem = useCallback(
    (e: PointerEvent | React.PointerEvent, idx: number) => {
      let s = new Set(selectedSet);
      if (e.ctrlKey) s.add(idx);
      else if (e.shiftKey) s.delete(idx);
      else if (!selectedSet.has(idx)) s = new Set([idx]);
      setSelectedSet(s);
      return s;
    },
    [selectedSet, setSelectedSet]
  );

  return { selectItem };
};
