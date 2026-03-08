import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Curriculum } from "../types/Curriculum/Curriculum";
import { buildSbjMap } from "../types/Curriculum/curriculumOp";
import { buildFamilyMap } from "../types/Family/familyOp";
import { buildChainMap } from "../types/Chain/chainOp";
import { useSbjCrud } from "../hooks/useSbj.Crud";
import { useSbjTree } from "../hooks/useSbj.Tree";
import { useSbjCnvs } from "../hooks/useSbj.Cnvs";
import { useSbjSync } from "../hooks/useSbj.Sync";
import { SbjDataContext } from "./SbjDataContext";
import { SbjSelectContext } from "./SbjSelectContext";
import { SbjSyncContext } from "./SbjSyncContext";
import type { GetSet } from "@/utils/GetSet";

export const SbjProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<ReadonlyArray<Curriculum>>([]);
  const [selectedSet, setSelectedSet] = useState(new Set<number>());

  // Ref bridge: CRUD callbacks read selection without reactive deps
  const selectedSetRef = useRef<ReadonlySet<number>>(selectedSet);
  useEffect(() => {
    selectedSetRef.current = selectedSet;
  }, [selectedSet]);
  const getSelected = useCallback(() => selectedSetRef.current, []);

  // GetSet wrappers (ref-based, never trigger re-renders)
  const treeDragRef = useRef(new Set<number>());
  const cnvsDragRef = useRef(new Set<number>());
  const cnvsDragStartRef = useRef({ x: 0, y: 0 });
  const preSourceRef = useRef(-1);
  const treeDrag = useMemo<GetSet<Set<number>>>(
    () => ({ get: () => treeDragRef.current, set: (s) => { treeDragRef.current = s; } }),
    []
  );
  const cnvsDrag = useMemo<GetSet<Set<number>>>(
    () => ({ get: () => cnvsDragRef.current, set: (s) => { cnvsDragRef.current = s; } }),
    []
  );
  const cnvsDragStart = useMemo<GetSet<{ x: number; y: number }>>(
    () => ({ get: () => cnvsDragStartRef.current, set: (s) => { cnvsDragStartRef.current = s; } }),
    []
  );
  const preSource = useMemo<GetSet<number>>(
    () => ({ get: () => preSourceRef.current, set: (s) => { preSourceRef.current = s; } }),
    []
  );

  // Derived maps — recomputed only when list changes
  const idx2sbj = useMemo(() => buildSbjMap(list), [list]);
  const idx2family = useMemo(() => buildFamilyMap(list), [list]);
  const idx2chain = useMemo(() => buildChainMap(list), [list]);

  // Operations
  const { addSbj, addCrs, delSbj, delCrs } = useSbjCrud(
    idx2family,
    getSelected,
    setList,
    setSelectedSet
  );
  const { setTreeMom, setTreeBro } = useSbjTree(idx2family, setList, treeDrag);
  const { setCnvsPre, setCnvsPos } = useSbjCnvs(idx2chain, setList, preSource);
  const sync = useSbjSync(list, setList);

  // selectItem depends on selectedSet — lives in SbjSelectContext
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

  // SbjDataContext: stable unless list changes
  const dataValue = useMemo(
    () => ({
      idx2sbj,
      idx2family,
      idx2chain,
      addSbj,
      addCrs,
      delSbj,
      delCrs,
      setTreeMom,
      setTreeBro,
      setCnvsPre,
      setCnvsPos,
      treeDrag,
      cnvsDrag,
      cnvsDragStart,
      preSource,
    }),
    [
      idx2sbj, idx2family, idx2chain,
      addSbj, addCrs, delSbj, delCrs,
      setTreeMom, setTreeBro,
      setCnvsPre, setCnvsPos,
      treeDrag, cnvsDrag, cnvsDragStart, preSource,
    ]
  );

  // SbjSelectContext: changes when user clicks to select
  const selectValue = useMemo(
    () => ({ selectedSet, selectItem }),
    [selectedSet, selectItem]
  );

  return (
    <SbjSyncContext.Provider value={sync}>
      <SbjDataContext.Provider value={dataValue}>
        <SbjSelectContext.Provider value={selectValue}>
          {children}
        </SbjSelectContext.Provider>
      </SbjDataContext.Provider>
    </SbjSyncContext.Provider>
  );
};
