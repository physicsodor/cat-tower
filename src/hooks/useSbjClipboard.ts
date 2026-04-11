import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { generateNKeysBetween } from "fractional-indexing";
import type { Curriculum, Subject, Course } from "@/lib/Curriculum/curriculum";
import type { TagType } from "@/lib/TagItem/tagItem";
import type { SpeciesType } from "@/lib/Species/species";
import type { FamilyMap } from "@/lib/Family/family";
import { getNewIdx } from "@/lib/IdxItem/idxItemOp";
import { removePre } from "@/lib/Chain/chainOp";
import { mergeTagTypes } from "@/lib/TagItem/tagItemOp";
import { mergeSpcTypes } from "@/lib/Species/speciesOp";
import { PASTE_OFFSET } from "@/lib/constants";

type Clip = {
  items: ReadonlyArray<Curriculum>;
  tagTypes: ReadonlyArray<TagType>;
  spcTypes: ReadonlyArray<SpeciesType>;
};

export const isEditingText = () => {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return (el as HTMLElement).isContentEditable;
};

export const useSbjClipboard = (
  getList: () => ReadonlyArray<Curriculum>,
  idx2family: FamilyMap,
  getSelected: () => ReadonlySet<number>,
  setList: Dispatch<SetStateAction<ReadonlyArray<Curriculum>>>,
  setSelectedSet: Dispatch<SetStateAction<Set<number>>>,
  delSbj: () => void,
  saveNow: () => void,
  undo: () => void,
  redo: () => void,
  getTagTypes: () => ReadonlyArray<TagType>,
  getSpcTypes: () => ReadonlyArray<SpeciesType>,
  setTagTypes: Dispatch<SetStateAction<TagType[]>>,
  setSpcTypes: Dispatch<SetStateAction<SpeciesType[]>>,
) => {
  const clipRef = useRef<Clip>({ items: [], tagTypes: [], spcTypes: [] });
  const [hasClip, setHasClip] = useState(false);

  const copy = useCallback(() => {
    const sel = getSelected();
    if (sel.size === 0) return;
    const items = getList().filter((x) => sel.has(x.idx));
    clipRef.current = { items, tagTypes: getTagTypes(), spcTypes: getSpcTypes() };
    setHasClip(items.length > 0);
  }, [getList, getSelected, getTagTypes, getSpcTypes]);

  const paste = useCallback(() => {
    const clip = clipRef.current;
    if (clip.items.length === 0) return;
    const list = getList();
    const currentTagTypes = getTagTypes();
    const currentSpcTypes = getSpcTypes();

    // Merge TagTypes and SpcTypes from clipboard into current project
    const { mergedTags, tagRemap } = mergeTagTypes(clip.tagTypes, currentTagTypes);
    const { mergedSpcs, spcRemap } = mergeSpcTypes(clip.spcTypes, currentSpcTypes);

    const clipIdxSet = new Set(clip.items.map((x) => x.idx));

    // Allocate new indices
    const tempMap = new Map<number, unknown>(list.map((x) => [x.idx, x]));
    const oldToNew = new Map<number, number>();
    for (const item of clip.items) {
      const newIdx = getNewIdx(tempMap);
      oldToNew.set(item.idx, newIdx);
      tempMap.set(newIdx, {});
    }

    // Group by new mom (always -1), sorted by original bro
    const momGroups = new Map<number, { item: Curriculum; bro: string }[]>();
    for (const item of clip.items) {
      const newMom = -1;
      const g = momGroups.get(newMom) ?? [];
      g.push({ item, bro: item.bro });
      momGroups.set(newMom, g);
    }
    for (const g of momGroups.values()) {
      g.sort((a, b) => (a.bro < b.bro ? -1 : a.bro > b.bro ? 1 : 0));
    }

    const newIdxSet = new Set<number>();
    const newItems: Curriculum[] = [];

    for (const [newMom, group] of momGroups) {
      const existingLast = idx2family.get(newMom)?.last ?? null;
      const bros = generateNKeysBetween(existingLast, null, group.length);
      group.forEach(({ item }, i) => {
        const newIdx = oldToNew.get(item.idx)!;
        newIdxSet.add(newIdx);
        if (item.sbjType === "COURSE") {
          newItems.push({ ...item, idx: newIdx, mom: newMom, bro: bros[i] });
        } else {
          const newPre = new Set<number>();
          for (const p of item.pre) {
            if (clipIdxSet.has(p)) {
              const mapped = oldToNew.get(p);
              if (mapped !== undefined) newPre.add(mapped);
            }
          }
          const newTag = new Set<number>();
          for (const t of item.tag) {
            const mapped = tagRemap.get(t);
            if (mapped !== undefined) newTag.add(mapped);
          }
          const newSpc = spcRemap.get(item.spc) ?? item.spc;
          newItems.push({
            ...item,
            idx: newIdx,
            mom: newMom,
            bro: bros[i],
            pre: newPre,
            tag: newTag,
            spc: newSpc,
            x: item.x + PASTE_OFFSET,
            y: item.y + PASTE_OFFSET,
          });
        }
      });
    }

    setTagTypes(mergedTags);
    setSpcTypes(mergedSpcs);
    setList((prev) => [...prev, ...newItems]);
    setSelectedSet(newIdxSet);
  }, [getList, idx2family, getTagTypes, getSpcTypes, setTagTypes, setSpcTypes, setList, setSelectedSet]);

  const cut = useCallback(() => {
    const sel = getSelected();
    if (sel.size === 0) return;
    const items = getList().filter((x) => sel.has(x.idx));
    clipRef.current = { items, tagTypes: getTagTypes(), spcTypes: getSpcTypes() };
    setHasClip(items.length > 0);
    const { updater: cleanPre } = removePre<Subject, Course>(sel);
    setList((prev) =>
      cleanPre(prev.filter((x) => !sel.has(x.idx))) as Curriculum[]
    );
    setSelectedSet(new Set());
  }, [getList, getSelected, getTagTypes, getSpcTypes, setList, setSelectedSet]);

  // Keyboard shortcuts (disabled when text editor is focused)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditingText()) return;
      if (e.key === "Delete") { e.preventDefault(); delSbj(); return; }
      if (!e.ctrlKey) return;
      if (e.key === "s") { e.preventDefault(); saveNow(); }
      else if (e.key === "c") { e.preventDefault(); copy(); }
      else if (e.key === "v") { e.preventDefault(); paste(); }
      else if (e.key === "x") { e.preventDefault(); cut(); }
      else if (e.key === "z") { e.preventDefault(); undo(); }
      else if (e.key === "y" || e.key === "Z") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [delSbj, saveNow, copy, paste, cut, undo, redo]);

  return { copy, paste, cut, hasClip };
};
