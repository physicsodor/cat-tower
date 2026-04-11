import { getNewIdx } from "@/lib/IdxItem/idxItemOp";
import type { FamilyMap } from "@/lib/Family/family";
import { DEFAULT_SPC_IDX } from "./species";
import type { Species, SpeciesMap, SpeciesType } from "./species";

export const buildSpeciesMap = (spcs: ReadonlyArray<SpeciesType>): SpeciesMap => {
  const map = new Map<number, SpeciesType>();
  for (const s of spcs) map.set(s.idx, s);
  return map;
};

export const addSpeciesType = (
  spcs: ReadonlyArray<SpeciesType>,
  data: Omit<SpeciesType, "idx">,
): SpeciesType[] => {
  const map = new Map(spcs.map((s) => [s.idx, s]));
  const idx = getNewIdx(map);
  return [...spcs, { ...data, idx }];
};

export const removeSpeciesType = <T extends Species>(
  spcIdx: number,
): {
  spcsUpdater: (spcs: ReadonlyArray<SpeciesType>) => SpeciesType[];
  itemUpdater: (list: ReadonlyArray<T>) => T[];
} | null => {
  if (spcIdx === DEFAULT_SPC_IDX) return null;
  const spcsUpdater = (spcs: ReadonlyArray<SpeciesType>) =>
    spcs.filter((s) => s.idx !== spcIdx);
  const itemUpdater = (list: ReadonlyArray<T>) =>
    list.map((x) => (x.spc === spcIdx ? { ...x, spc: DEFAULT_SPC_IDX } : x));
  return { spcsUpdater, itemUpdater };
};

export const updateSpeciesType = (
  spcIdx: number,
  patch: Partial<Omit<SpeciesType, "idx">>,
): { updater: (spcs: ReadonlyArray<SpeciesType>) => SpeciesType[] } => {
  const updater = (spcs: ReadonlyArray<SpeciesType>) =>
    spcs.map((s) => (s.idx === spcIdx ? { ...s, ...patch } : s));
  return { updater };
};

export const setSpc = <T extends Species>(
  targetSet: ReadonlySet<number>,
  spcIdx: number,
): { updater: (list: ReadonlyArray<T>) => T[] } => {
  const updater = (list: ReadonlyArray<T>) =>
    list.map((x) => (targetSet.has(x.idx) ? { ...x, spc: spcIdx } : x));
  return { updater };
};

export const mergeSpcTypes = (
  srcSpcs: ReadonlyArray<SpeciesType>,
  dstSpcs: ReadonlyArray<SpeciesType>,
): { mergedSpcs: SpeciesType[]; spcRemap: ReadonlyMap<number, number> } => {
  const titleToIdx = new Map(dstSpcs.map((s) => [s.title, s.idx]));
  const mergedSpcs: SpeciesType[] = [...dstSpcs];
  const spcRemap = new Map<number, number>();
  const tempMap = new Map(dstSpcs.map((s) => [s.idx, s]));

  for (const src of srcSpcs) {
    if (src.idx === DEFAULT_SPC_IDX) {
      spcRemap.set(src.idx, DEFAULT_SPC_IDX);
      continue;
    }
    const dstIdx = titleToIdx.get(src.title);
    if (dstIdx !== undefined) {
      spcRemap.set(src.idx, dstIdx);
    } else {
      const newIdx = getNewIdx(tempMap);
      const newSpc: SpeciesType = { ...src, idx: newIdx };
      mergedSpcs.push(newSpc);
      tempMap.set(newIdx, newSpc);
      titleToIdx.set(src.title, newIdx);
      spcRemap.set(src.idx, newIdx);
    }
  }

  return { mergedSpcs, spcRemap };
};

export const getLabelParts = (
  itemIdx: number,
  spcMap: SpeciesMap,
  idx2sbj: { get(key: number): unknown },
  familyMap: FamilyMap,
): { prefix: string; num: string } | null => {
  const itemInfo = idx2sbj.get(itemIdx);
  if (!itemInfo || typeof itemInfo !== "object") return null;
  const itemSpc = (itemInfo as { spc?: number }).spc;
  if (itemSpc === undefined) return null;
  const spcType = spcMap.get(itemSpc);
  if (!spcType) return null;

  const prefix = spcType.prefix ?? "";
  const hasNumber = spcType.number !== "NONE";
  if (!prefix && !hasNumber) return null;

  let num = "";
  if (hasNumber) {
    const inOrder: number[] = [];
    const dfs = (mom: number) => {
      for (const kid of familyMap.get(mom)?.kids ?? []) {
        inOrder.push(kid);
        dfs(kid);
      }
    };
    dfs(-1);

    const getSpc = (x: unknown): number | undefined =>
      x && typeof x === "object" ? (x as { spc?: number }).spc : undefined;

    if (spcType.number === "INDEP") {
      let count = 0;
      for (const idx of inOrder) {
        if (getSpc(idx2sbj.get(idx)) !== itemSpc) continue;
        count++;
        if (idx === itemIdx) break;
      }
      num = String(count);
    } else {
      const getTopAnc = (idx: number): number => {
        const mom = familyMap.get(idx)?.mom;
        if (mom === undefined || mom === -1) return idx;
        return getTopAnc(mom);
      };
      const topAncIdx = getTopAnc(itemIdx);
      const topLevel = inOrder.filter((idx) => (familyMap.get(idx)?.mom ?? -1) === -1);
      const chapterNum = topLevel.indexOf(topAncIdx) + 1;
      const chapterItems: number[] = [];
      const dfsChapter = (idx: number) => {
        chapterItems.push(idx);
        for (const kid of familyMap.get(idx)?.kids ?? []) dfsChapter(kid);
      };
      dfsChapter(topAncIdx);
      let itemNum = 0;
      for (const idx of chapterItems) {
        if (getSpc(idx2sbj.get(idx)) !== itemSpc) continue;
        itemNum++;
        if (idx === itemIdx) break;
      }
      num = `${chapterNum}.${itemNum}`;
    }
  }

  return { prefix, num };
};

export const getLabel = <T extends Species>(
  item: T,
  spcMap: SpeciesMap,
  list: ReadonlyArray<T>,
  familyMap: FamilyMap,
): string => {
  const spcType = spcMap.get(item.spc);
  if (!spcType || spcType.number === "NONE") return "";

  const { prefix } = spcType;
  const idx2item = new Map(list.map((x) => [x.idx, x]));

  // DFS traversal from root in family order (kids already sorted by bro in familyMap)
  const inOrder: number[] = [];
  const _dfs = (mom: number) => {
    const kids = familyMap.get(mom)?.kids ?? [];
    for (const kid of kids) {
      inOrder.push(kid);
      _dfs(kid);
    }
  };
  _dfs(-1);

  if (spcType.number === "INDEP") {
    let count = 0;
    for (const idx of inOrder) {
      const x = idx2item.get(idx);
      if (!x || x.spc !== item.spc) continue;
      count++;
      if (idx === item.idx) break;
    }
    return `${prefix} ${count}`;
  }

  // DEP: find top-level ancestor (the ancestor whose mom === -1)
  const getTopAncestor = (idx: number): number => {
    const x = idx2item.get(idx);
    if (!x || x.mom === -1) return idx;
    return getTopAncestor(x.mom);
  };

  const topAncIdx = getTopAncestor(item.idx);

  // Chapter number: position of topAncIdx among top-level items in DFS order
  const topLevelInOrder = inOrder.filter((idx) => idx2item.get(idx)?.mom === -1);
  const chapterNum = topLevelInOrder.indexOf(topAncIdx) + 1;

  // Item number: position among same-spc items under topAncIdx in DFS order
  const chapterItems: number[] = [];
  const _dfsChapter = (idx: number) => {
    chapterItems.push(idx);
    const kids = familyMap.get(idx)?.kids ?? [];
    for (const kid of kids) _dfsChapter(kid);
  };
  _dfsChapter(topAncIdx);

  let itemNum = 0;
  for (const idx of chapterItems) {
    const x = idx2item.get(idx);
    if (!x || x.spc !== item.spc) continue;
    itemNum++;
    if (idx === item.idx) break;
  }

  return `${prefix} ${chapterNum}.${itemNum}`;
};
