import { createContext, useContext } from "react";
import type { SbjMap } from "../model/Curriculum/curriculum";
import type { FamilyMap, BroDir } from "@/lib/Family/family";
import type { ChainMap } from "@/lib/Chain/chain";
import type { GetSet } from "@/utils/GetSet";
import type { Camera } from "@/components/InfiniteCanvas";
import type { BBox } from "../model/rect";

type SbjDataContextValue = {
  idx2sbj: SbjMap;
  idx2family: FamilyMap;
  idx2chain: ChainMap;
  addSbj: () => void;
  addCrs: () => void;
  delSbj: () => void;
  delSbjOne: (idx: number) => void;
  delCrs: (idx: number) => void;
  copy: () => void;
  paste: () => void;
  cut: () => void;
  hasClip: boolean;
  setTreeMom: (trg: ReadonlySet<number>, mom: number) => void;
  setTreeBro: (trg: ReadonlySet<number>, idx: number, dir: BroDir) => void;
  setCnvsPre: (idx: number) => void;
  setCnvsPos: (trg: Set<number>, dxy: { dx: number; dy: number }) => void;
  autoLayout: (bboxMap: Map<number, BBox>) => void;
  getCamera: () => Camera;
  setCamera: (camera: Camera) => void;
  treeDrag: GetSet<Set<number>>;
  cnvsDrag: GetSet<Set<number>>;
  preSource: GetSet<number>;
  syncCamera: (camera: Camera) => void;
  editingIdx: number | null;
  openEdit: (idx: number) => void;
  closeEdit: () => void;
  updateSbj: (
    idx: number,
    fields: { title: string; short?: string; content: string },
  ) => void;
  updateCrs: (idx: number, fields: { title: string; short?: string }) => void;
  removePreLink: (idxA: number, idxB: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export const SbjDataContext = createContext<SbjDataContextValue | null>(null);

export const useSbjData = () => {
  const ctx = useContext(SbjDataContext);
  if (!ctx) throw new Error("SbjDataContext가 Provider에 포함되지 않았습니다.");
  return ctx;
};
