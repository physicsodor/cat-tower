import { createContext, useContext } from "react";
import type { SbjInfo } from "../types/Curriculum/curriculumOp";
import type { FamilyMap, BroDir } from "../types/Family/familyOp";
import type { ChainMap } from "../types/Chain/chainOp";
import type { GetSet } from "@/utils/GetSet";
import type { Camera } from "@/components/InfiniteCanvas";

type SbjDataContextValue = {
  idx2sbj: Map<number, SbjInfo>;
  idx2family: FamilyMap;
  idx2chain: ChainMap;
  addSbj: () => void;
  addCrs: () => void;
  delSbj: () => void;
  delSbjOne: (idx: number) => void;
  delCrs: (idx: number) => void;
  setTreeMom: (trg: ReadonlySet<number>, mom: number) => void;
  setTreeBro: (trg: ReadonlySet<number>, idx: number, dir: BroDir) => void;
  setCnvsPre: (idx: number) => void;
  setCnvsPos: (trg: Set<number>, dxy: { dx: number; dy: number }) => void;
  autoLayout: (sizes?: Map<number, { w: number; h: number }>) => void;
  getZoom: () => number;
  treeDrag: GetSet<Set<number>>;
  cnvsDrag: GetSet<Set<number>>;
  preSource: GetSet<number>;
  syncCamera: (camera: Camera) => void;
  editingIdx: number | null;
  openEdit: (idx: number) => void;
  closeEdit: () => void;
  updateSbj: (idx: number, fields: { title: string; short?: string; content: string; description: string }) => void;
};

export const SbjDataContext = createContext<SbjDataContextValue | null>(null);

export const useSbjData = () => {
  const ctx = useContext(SbjDataContext);
  if (!ctx) throw new Error("SbjDataContext가 Provider에 포함되지 않았습니다.");
  return ctx;
};
