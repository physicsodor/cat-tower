import { type Dispatch, type SetStateAction, useCallback } from "react";
import type { TagType } from "@/lib/TagItem/tagItem";
import type { Curriculum } from "@/lib/Curriculum/curriculum";
import {
  addTagType as addTagTypeFn,
  renameTagType as renameTagTypeFn,
  deleteTagType as deleteTagTypeFn,
} from "@/lib/TagItem/tagItemOp";

export const useTagCrud = (
  tagTypes: ReadonlyArray<TagType>,
  setTagTypes: Dispatch<SetStateAction<TagType[]>>,
  setList: Dispatch<SetStateAction<ReadonlyArray<Curriculum>>>,
) => {
  const addTagType = useCallback(() => {
    const { newIdx, updater } = addTagTypeFn(tagTypes);
    setTagTypes(updater);
    return newIdx;
  }, [tagTypes, setTagTypes]);

  const renameTagType = useCallback(
    (idx: number, title: string) => {
      const { updater } = renameTagTypeFn(idx, title);
      setTagTypes(updater);
    },
    [setTagTypes],
  );

  const deleteTagType = useCallback(
    (tagIdx: number) => {
      const { updater } = deleteTagTypeFn(tagIdx);
      setTagTypes(updater);
      setList((prev) =>
        prev.map((item) => {
          if (item.sbjType !== "SUBJECT" || !item.tag.has(tagIdx)) return item;
          const tag = new Set(item.tag);
          tag.delete(tagIdx);
          return { ...item, tag };
        }),
      );
    },
    [setTagTypes, setList],
  );

  const toggleTag = useCallback(
    (itemIdx: number, tagIdx: number) => {
      setList((prev) =>
        prev.map((item) => {
          if (item.sbjType !== "SUBJECT" || item.idx !== itemIdx) return item;
          const tag = new Set(item.tag);
          if (tag.has(tagIdx)) tag.delete(tagIdx);
          else tag.add(tagIdx);
          return { ...item, tag };
        }),
      );
    },
    [setList],
  );

  return { addTagType, renameTagType, deleteTagType, toggleTag };
};
