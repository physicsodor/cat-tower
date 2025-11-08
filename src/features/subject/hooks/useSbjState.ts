import { useMemo, useRef, useState } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum";

export const useSbjState = () => {
  const [list, setList] = useState<ReadonlyArray<Curriculum>>([]);
  const [slcSet, setSlcSet] = useState(new Set<number>());
  // const treeDragRef = useRef(new Set<number>());
  const cnvsDragRef = useRef(new Set<number>());
  const cnvsPxyRef = useRef({ px: 0, py: 0 });
  const preFromRef = useRef(-1);

  // const treeDrag = useMemo(
  //   () => ({
  //     get: () => treeDragRef.current,
  //     set: (s: Set<number>) => {
  //       treeDragRef.current = s;
  //     },
  //   }),
  //   []
  // );
  const cnvsDrag = useMemo(
    () => ({
      get: () => cnvsDragRef.current,
      set: (s: Set<number>) => {
        cnvsDragRef.current = s;
      },
    }),
    []
  );
  const cnvsPxy = useMemo(
    () => ({
      get: () => cnvsPxyRef.current,
      set: (s: { px: number; py: number }) => {
        cnvsPxyRef.current = s;
      },
    }),
    []
  );
  const preFrom = useMemo(
    () => ({
      get: () => preFromRef.current,
      set: (s: number) => {
        preFromRef.current = s;
      },
    }),
    []
  );

  return {
    list,
    setList,
    slcSet,
    setSlcSet,
    // treeDrag,
    cnvsDrag,
    cnvsPxy,
    preFrom,
  };
};
