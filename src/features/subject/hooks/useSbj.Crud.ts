import { useCallback } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";
import {
  addCourse,
  addSubject,
  deleteCourse,
  deleteSubject,
} from "@/features/subject/types/Curriculum/curriculumOp";
import type { FamilyMap } from "../types/Family/familyOp";

export const useSbjCrud = (
  idx2family: FamilyMap,
  selectedSet: ReadonlySet<number>,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  setSelectedSet: React.Dispatch<React.SetStateAction<Set<number>>>
) => {
  const addSbj = useCallback(() => {
    const { newIdx, updater } = addSubject(idx2family);
    setList(updater);
    setSelectedSet(new Set([newIdx]));
  }, [idx2family, setList, setSelectedSet]);

  const addCrs = useCallback(() => {
    const { updater } = addCourse(idx2family, selectedSet);
    setList(updater);
  }, [idx2family, selectedSet, setList]);

  const delSbj = useCallback(() => {
    const { updater } = deleteSubject(selectedSet);
    setList(updater);
    setSelectedSet(new Set());
  }, [selectedSet, setList, setSelectedSet]);

  const delCrs = useCallback(
    (idx: number) => {
      const { updater } = deleteCourse(idx2family, idx);
      setList(updater);
      setSelectedSet(new Set(idx2family.get(idx)?.kids ?? []));
    },
    [idx2family, setList, setSelectedSet]
  );

  return { addSbj, addCrs, delSbj, delCrs };
};
