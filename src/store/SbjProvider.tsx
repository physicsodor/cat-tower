import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TagType } from "@/lib/TagItem/tagItem";
import type { SpeciesType } from "@/lib/Species/species";
import { DEFAULT_SPC_IDX } from "@/lib/Species/species";
import type { Subject } from "@/lib/Curriculum/curriculum";
import { buildSbjMap } from "@/lib/Curriculum/curriculumOp";
import { buildFamilyMap } from "@/lib/Family/familyOp";
import { buildChainMap } from "@/lib/Chain/chainOp";
import { buildSpeciesMap } from "@/lib/Species/speciesOp";
import { useSbjCrud } from "@/hooks/useSbjCrud";
import { useSbjTree } from "@/hooks/useSbjTree";
import { useSbjCnvs } from "@/hooks/useSbjCnvs";
import { useSbjSync } from "@/hooks/useSbjSync";
import { useSbjClipboard } from "@/hooks/useSbjClipboard";
import { useHistory } from "@/hooks/useHistory";
import { useTagCrud } from "@/hooks/useTagCrud";
import { useSpeciesCrud } from "@/hooks/useSpeciesCrud";
import { SbjDataContext } from "./SbjDataContext";
import { SbjSelectContext } from "./SbjSelectContext";
import { SbjSyncContext } from "./SbjSyncContext";
import type { GetSet } from "@/utils/GetSet";
import type { Camera } from "infinite-canvas";

const DEFAULT_SPC_ENTRY: SpeciesType = { idx: DEFAULT_SPC_IDX, title: "없음", prefix: "", number: "NONE", colorCode: 0 };

export const SbjProvider = ({ children }: { children: ReactNode }) => {
  const { list, listRef, setList, loadList, undo, redo, canUndo, canRedo } =
    useHistory();
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const tagTypesRef = useRef<ReadonlyArray<TagType>>(tagTypes);
  useEffect(() => { tagTypesRef.current = tagTypes; }, [tagTypes]);
  const getTagTypes = useCallback(() => tagTypesRef.current, []);
  const loadTagTypes = useCallback((v: TagType[]) => setTagTypes(v), []);
  const [spcTypes, setSpcTypes] = useState<SpeciesType[]>([DEFAULT_SPC_ENTRY]);
  const spcTypesRef = useRef<ReadonlyArray<SpeciesType>>(spcTypes);
  useEffect(() => { spcTypesRef.current = spcTypes; }, [spcTypes]);
  const getSpcTypes = useCallback(() => spcTypesRef.current, []);
  const loadSpcTypes = useCallback((v: SpeciesType[]) => {
    const hasDefault = v.some((s) => s.idx === DEFAULT_SPC_IDX);
    setSpcTypes(hasDefault ? v : [DEFAULT_SPC_ENTRY, ...v]);
  }, []);
  const { addTagType, renameTagType, deleteTagType, toggleTag } = useTagCrud(tagTypes, setTagTypes, setList);
  const { addSpcType, removeSpcType, updateSpcType, setSpc } = useSpeciesCrud(setSpcTypes, setList);
  const [isTagPanelOpen, setIsTagPanelOpen] = useState(false);
  const openTagPanel = useCallback(() => setIsTagPanelOpen(true), []);
  const closeTagPanel = useCallback(() => setIsTagPanelOpen(false), []);
  const [isSpcPanelOpen, setIsSpcPanelOpen] = useState(false);
  const openSpcPanel = useCallback(() => setIsSpcPanelOpen(true), []);
  const closeSpcPanel = useCallback(() => setIsSpcPanelOpen(false), []);
  const [selectedSet, setSelectedSet] = useState(new Set<number>());

  // Ref bridge: CRUD callbacks read selection without reactive deps
  const selectedSetRef = useRef<ReadonlySet<number>>(selectedSet);
  useEffect(() => {
    selectedSetRef.current = selectedSet;
  }, [selectedSet]);
  const getSelected = useCallback(() => selectedSetRef.current, []);

  // Ref bridge: clipboard callbacks read list without reactive deps
  const getList = useCallback(() => listRef.current, [listRef]);

  // Camera ref — updated by SbjCnvs via syncCamera
  const cameraRef = useRef<Camera>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    zoom: 1,
  });
  const syncCamera = useCallback((c: Camera) => {
    cameraRef.current = c;
  }, []);
  const getCamera = useCallback(() => cameraRef.current, []);
  const setCamera = useCallback((c: Camera) => {
    cameraRef.current = c;
  }, []);

  // GetSet wrappers (ref-based, never trigger re-renders)
  const treeDragRef = useRef(new Set<number>());
  const cnvsDragRef = useRef(new Set<number>());
  const preSourceRef = useRef(-1);
  const treeDrag = useMemo<GetSet<Set<number>>>(
    () => ({
      get: () => treeDragRef.current,
      set: (s) => {
        treeDragRef.current = s;
      },
    }),
    [],
  );
  const cnvsDrag = useMemo<GetSet<Set<number>>>(
    () => ({
      get: () => cnvsDragRef.current,
      set: (s) => {
        cnvsDragRef.current = s;
      },
    }),
    [],
  );
  const preSource = useMemo<GetSet<number>>(
    () => ({
      get: () => preSourceRef.current,
      set: (s) => {
        preSourceRef.current = s;
      },
    }),
    [],
  );

  // Derived maps — recomputed only when list changes
  const idx2sbj = useMemo(() => buildSbjMap(list), [list]);
  const idx2family = useMemo(() => buildFamilyMap(list), [list]);
  const idx2chain = useMemo(() => buildChainMap(list), [list]);
  const idx2spc = useMemo(() => buildSpeciesMap(spcTypes), [spcTypes]);
  const idx2tag = useMemo(
    () => new Map(list.filter((x): x is Subject => x.sbjType === "SUBJECT").map((x) => [x.idx, x.tag])),
    [list],
  );

  // Edit modal state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const openEdit = useCallback((idx: number) => setEditingIdx(idx), []);
  const closeEdit = useCallback(() => setEditingIdx(null), []);
  const updateSbj = useCallback(
    (
      idx: number,
      fields: { title: string; short?: string; content: string },
    ) => {
      setList((prev) =>
        prev.map((item) =>
          item.idx === idx && item.sbjType === "SUBJECT"
            ? { ...item, ...fields }
            : item,
        ),
      );
    },
    [setList],
  );
  const updateCrs = useCallback(
    (idx: number, fields: { title: string; short?: string }) => {
      setList((prev) =>
        prev.map((item) =>
          item.idx === idx && item.sbjType === "COURSE"
            ? { ...item, ...fields }
            : item,
        ),
      );
    },
    [setList],
  );
  const removePreLink = useCallback(
    (idxA: number, idxB: number) => {
      setList((prev) =>
        prev.map((item) => {
          if (item.idx !== idxA || item.sbjType !== "SUBJECT") return item;
          const pre = new Set(item.pre);
          pre.delete(idxB);
          return { ...item, pre };
        }),
      );
    },
    [setList],
  );

  // Operations
  const { addSbj, addCrs, delSbj, delSbjOne, delCrs } = useSbjCrud(
    idx2family,
    getSelected,
    setList,
    setSelectedSet,
    cameraRef,
  );
  const { setTreeMom, setTreeBro, exitTreeMom } = useSbjTree(idx2family, setList, treeDrag);
  const { setCnvsPre, setCnvsPos, autoLayout } = useSbjCnvs(
    idx2chain,
    setList,
    preSource,
  );
  const sync = useSbjSync(list, tagTypes, spcTypes, loadList, loadTagTypes, loadSpcTypes);
  const ctrlS = useCallback(
    () => (sync.isLoggedIn ? sync.saveNow() : sync.openShare()),
    [sync],
  );
  const { copy, paste, cut, hasClip } = useSbjClipboard(
    getList,
    idx2family,
    getSelected,
    setList,
    setSelectedSet,
    delSbj,
    ctrlS,
    undo,
    redo,
    getTagTypes,
    getSpcTypes,
    setTagTypes,
    setSpcTypes,
  );

  const selectMany = useCallback((s: Set<number>) => setSelectedSet(s), []);

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
    [selectedSet, setSelectedSet],
  );

  // SbjDataContext: stable unless list changes
  const dataValue = useMemo(
    () => ({
      tagTypes,
      idx2tag,
      addTagType,
      renameTagType,
      deleteTagType,
      toggleTag,
      isTagPanelOpen,
      openTagPanel,
      closeTagPanel,
      spcTypes,
      idx2spc,
      addSpcType,
      removeSpcType,
      updateSpcType,
      setSpc,
      isSpcPanelOpen,
      openSpcPanel,
      closeSpcPanel,
      idx2sbj,
      idx2family,
      idx2chain,
      addSbj,
      addCrs,
      delSbj,
      delSbjOne,
      delCrs,
      copy,
      paste,
      cut,
      hasClip,
      setTreeMom,
      setTreeBro,
      exitTreeMom,
      setCnvsPre,
      setCnvsPos,
      autoLayout,
      treeDrag,
      cnvsDrag,
      preSource,
      syncCamera,
      getCamera,
      setCamera,
      editingIdx,
      openEdit,
      closeEdit,
      updateSbj,
      updateCrs,
      removePreLink,
      undo,
      redo,
      canUndo,
      canRedo,
    }),
    [
      tagTypes,
      idx2tag,
      addTagType,
      renameTagType,
      deleteTagType,
      toggleTag,
      isTagPanelOpen,
      openTagPanel,
      closeTagPanel,
      spcTypes,
      idx2spc,
      addSpcType,
      removeSpcType,
      updateSpcType,
      setSpc,
      isSpcPanelOpen,
      openSpcPanel,
      closeSpcPanel,
      idx2sbj,
      idx2family,
      idx2chain,
      addSbj,
      addCrs,
      delSbj,
      delSbjOne,
      delCrs,
      copy,
      paste,
      cut,
      hasClip,
      setTreeMom,
      setTreeBro,
      exitTreeMom,
      setCnvsPre,
      setCnvsPos,
      autoLayout,
      treeDrag,
      cnvsDrag,
      preSource,
      syncCamera,
      getCamera,
      setCamera,
      editingIdx,
      openEdit,
      closeEdit,
      updateSbj,
      updateCrs,
      removePreLink,
      undo,
      redo,
      canUndo,
      canRedo,
    ],
  );

  // SbjSelectContext: changes when user clicks to select
  const selectValue = useMemo(
    () => ({ selectedSet, selectItem, selectMany }),
    [selectedSet, selectItem, selectMany],
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
