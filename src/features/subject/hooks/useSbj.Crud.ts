import { useCallback } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum";
import {
  addCourse,
  addSubject,
  deleteCourse,
  deleteSubject,
} from "@/features/subject/utils/curriculumOp";
import type { FamilyMap } from "../utils/familyOp";

export const useSbjCrud = (
  idx2family: FamilyMap,
  slcSet: ReadonlySet<number>,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  setSlcSet: React.Dispatch<React.SetStateAction<Set<number>>>
) => {
  const addSbj = useCallback(() => {
    const { newIdx, updator } = addSubject(idx2family);
    setList(updator);
    setSlcSet(new Set([newIdx]));
  }, [idx2family, setList, setSlcSet]);

  const addCrs = useCallback(() => {
    const { updator } = addCourse(idx2family, slcSet);
    setList(updator);
  }, [idx2family, slcSet, setList]);

  const delSbj = useCallback(() => {
    const { updator } = deleteSubject(slcSet);
    setList(updator);
    setSlcSet(new Set());
  }, [slcSet, setList, setSlcSet]);

  const delCrs = useCallback(
    (idx: number) => {
      const { updator } = deleteCourse(idx2family, idx);
      setList(updator);
      setSlcSet(new Set(idx2family.get(idx)?.kids ?? []));
    },
    [idx2family, setList, setSlcSet]
  );

  return { addSbj, addCrs, delSbj, delCrs };
};
