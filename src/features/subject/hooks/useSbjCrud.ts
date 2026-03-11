import { useCallback, type RefObject } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";
import {
  addCourse,
  addSubject,
  deleteCourse,
  deleteSubject,
} from "@/features/subject/types/Curriculum/curriculumOp";
import type { FamilyMap } from "../types/Family/familyOp";
import type { Camera } from "@/components/InfiniteCanvas";

export const useSbjCrud = (
  idx2family: FamilyMap,
  getSelected: () => ReadonlySet<number>,
  setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>>,
  setSelectedSet: React.Dispatch<React.SetStateAction<Set<number>>>,
  cameraRef: RefObject<Camera>
) => {
  const addSbj = useCallback(() => {
    const cam = cameraRef.current;
    const x = cam ? (window.innerWidth / 2 - cam.x) / cam.zoom : 0;
    const y = cam ? (window.innerHeight / 2 - cam.y) / cam.zoom : 0;
    const { newIdx, updater } = addSubject(idx2family, x, y);
    setList(updater);
    setSelectedSet(new Set([newIdx]));
  }, [idx2family, setList, setSelectedSet, cameraRef]);

  const addCrs = useCallback(() => {
    const { updater } = addCourse(idx2family, getSelected());
    setList(updater);
  }, [idx2family, getSelected, setList]);

  const delSbj = useCallback(() => {
    const { updater } = deleteSubject(getSelected());
    setList(updater);
    setSelectedSet(new Set());
  }, [getSelected, setList, setSelectedSet]);

  const delSbjOne = useCallback((idx: number) => {
    const { updater } = deleteSubject(new Set([idx]));
    setList(updater);
    setSelectedSet((prev) => { const s = new Set(prev); s.delete(idx); return s; });
  }, [setList, setSelectedSet]);

  const delCrs = useCallback(
    (idx: number) => {
      const { updater } = deleteCourse(idx2family, idx);
      setList(updater);
      setSelectedSet(new Set(idx2family.get(idx)?.kids ?? []));
    },
    [idx2family, setList, setSelectedSet]
  );

  return { addSbj, addCrs, delSbj, delSbjOne, delCrs };
};
