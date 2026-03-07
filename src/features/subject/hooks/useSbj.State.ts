import { useMemo, useRef, useState } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";

export const useSbjState = () => {
  const [list, setList] = useState<ReadonlyArray<Curriculum>>([]);
  const [selectedSet, setSelectedSet] = useState(new Set<number>());
  const treeDragRef = useRef(new Set<number>());
  const cnvsDragRef = useRef(new Set<number>());
  const cnvsDragStartRef = useRef({ x: 0, y: 0 });
  const preSourceRef = useRef(-1);

  const treeDrag = useMemo(
    () => ({
      get: () => treeDragRef.current,
      set: (s: Set<number>) => {
        treeDragRef.current = s;
      },
    }),
    []
  );
  const cnvsDrag = useMemo(
    () => ({
      get: () => cnvsDragRef.current,
      set: (s: Set<number>) => {
        cnvsDragRef.current = s;
      },
    }),
    []
  );
  const cnvsDragStart = useMemo(
    () => ({
      get: () => cnvsDragStartRef.current,
      set: (s: { x: number; y: number }) => {
        cnvsDragStartRef.current = s;
      },
    }),
    []
  );
  const preSource = useMemo(
    () => ({
      get: () => preSourceRef.current,
      set: (s: number) => {
        preSourceRef.current = s;
      },
    }),
    []
  );

  return {
    list,
    setList,
    selectedSet,
    setSelectedSet,
    treeDrag,
    cnvsDrag,
    cnvsDragStart,
    preSource,
  };
};
