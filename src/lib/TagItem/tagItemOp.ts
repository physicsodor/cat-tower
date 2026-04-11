import type { TagType, TagItem } from "./TagItem";
import { getNewIdx } from "@/lib/IdxItem/idxItemOp";

export const addTagType = (
  tagTypes: ReadonlyArray<TagType>,
): { newIdx: number; updater: (list: ReadonlyArray<TagType>) => TagType[] } => {
  const idx2tag = new Map(tagTypes.map((t) => [t.idx, t]));
  const newIdx = getNewIdx(idx2tag);
  const newItem: TagType = { idx: newIdx, title: "" };
  const updater = (list: ReadonlyArray<TagType>) => [...list, newItem];
  return { newIdx, updater };
};

export const renameTagType = (
  idx: number,
  title: string,
): { updater: (list: ReadonlyArray<TagType>) => TagType[] } => {
  const updater = (list: ReadonlyArray<TagType>) =>
    list.map((t) => (t.idx === idx ? { ...t, title } : t));
  return { updater };
};

export const deleteTagType = (
  idx: number,
): { updater: (list: ReadonlyArray<TagType>) => TagType[] } => {
  const updater = (list: ReadonlyArray<TagType>) =>
    list.filter((t) => t.idx !== idx);
  return { updater };
};

export const removeTag = <T extends TagItem>(
  tagIdx: number,
): { updater: (list: ReadonlyArray<T>) => T[] } => {
  const updater = (list: ReadonlyArray<T>) =>
    list.map((x) => {
      if (!x.tag.has(tagIdx)) return x;
      const tag = new Set(x.tag);
      tag.delete(tagIdx);
      return { ...x, tag };
    });
  return { updater };
};

const isTagItem = (x: unknown): x is TagItem =>
  typeof x === "object" && x !== null && "tag" in x && (x as TagItem).tag instanceof Set;

export const pruneTagTypes = <T>(
  list: ReadonlyArray<T>,
  tagTypes: ReadonlyArray<TagType>,
): TagType[] => {
  const used = new Set<number>();
  for (const item of list) {
    if (isTagItem(item)) {
      for (const idx of item.tag) used.add(idx);
    }
  }
  return tagTypes.filter((t) => used.has(t.idx));
};

export const toggleTag = <T extends TagItem>(
  itemIdx: number,
  tagIdx: number,
): { updater: (list: ReadonlyArray<T>) => T[] } => {
  const updater = (list: ReadonlyArray<T>) =>
    list.map((x) => {
      if (x.idx !== itemIdx) return x;
      const tag = new Set(x.tag);
      if (tag.has(tagIdx)) tag.delete(tagIdx);
      else tag.add(tagIdx);
      return { ...x, tag };
    });
  return { updater };
};
