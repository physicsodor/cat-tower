import { useCallback, useEffect, useRef, useState } from "react";
import { generateNKeysBetween } from "fractional-indexing";
import type { Curriculum, Subject, Course } from "../types/Curriculum/Curriculum";
import type { FamilyMap } from "../types/Family/familyOp";
import { getNewIdx } from "../types/IdxItem/idxItemOp";
import { removePre } from "../types/Chain/chainOp";
import { PASTE_OFFSET } from "@/features/subject/constants";

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
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  setSelectedSet: React.Dispatch<React.SetStateAction<Set<number>>>,
  delSbj: () => void,
  saveNow: () => void,
  undo: () => void,
  redo: () => void,
) => {
  const clipRef = useRef<ReadonlyArray<Curriculum>>([]);
  const [hasClip, setHasClip] = useState(false);

  const copy = useCallback(() => {
    const sel = getSelected();
    if (sel.size === 0) return;
    const items = getList().filter((x) => sel.has(x.idx));
    clipRef.current = items;
    setHasClip(items.length > 0);
  }, [getList, getSelected]);

  const paste = useCallback(() => {
    const clip = clipRef.current;
    if (clip.length === 0) return;
    const list = getList();

    const clipIdxSet = new Set(clip.map((x) => x.idx));

    // Allocate new indices
    const tempMap = new Map<number, unknown>(list.map((x) => [x.idx, x]));
    const oldToNew = new Map<number, number>();
    for (const item of clip) {
      const newIdx = getNewIdx(tempMap);
      oldToNew.set(item.idx, newIdx);
      tempMap.set(newIdx, {}); // reserve
    }

    // Group by new mom (always -1), sorted by original bro
    const momGroups = new Map<number, { item: Curriculum; bro: string }[]>();
    for (const item of clip) {
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
          newItems.push({
            ...item,
            idx: newIdx,
            mom: newMom,
            bro: bros[i],
            pre: newPre,
            x: item.x + PASTE_OFFSET,
            y: item.y + PASTE_OFFSET,
          });
        }
      });
    }

    setList((prev) => [...prev, ...newItems]);
    setSelectedSet(newIdxSet);
  }, [getList, idx2family, setList, setSelectedSet]);

  const cut = useCallback(() => {
    const sel = getSelected();
    if (sel.size === 0) return;
    const items = getList().filter((x) => sel.has(x.idx));
    clipRef.current = items;
    setHasClip(items.length > 0);
    const { updater: cleanPre } = removePre<Subject, Course>(sel);
    setList((prev) =>
      cleanPre(prev.filter((x) => !sel.has(x.idx))) as Curriculum[]
    );
    setSelectedSet(new Set());
  }, [getList, getSelected, setList, setSelectedSet]);

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
