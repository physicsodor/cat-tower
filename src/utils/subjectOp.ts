import {
  newCourse,
  newSubject,
  type Course,
  type Subject,
} from "../types/Subject";
import { addFamily, deleteFamily } from "./familyOp";

export const addSubject = (
  SList: (Subject | Course)[]
): { newIdx: number; newList: (Subject | Course)[]; newIsMom: boolean } => {
  const newIsMom = false;
  return { ...addFamily(SList, newSubject, -1, newIsMom), newIsMom: newIsMom };
};

export const addCourse = (
  SList: (Subject | Course)[]
): { newIdx: number; newList: (Subject | Course)[]; newIsMom: boolean } => {
  const newIsMom = true;
  const result = addFamily(SList, newCourse, -1, newIsMom);
  return { ...result, newIsMom: newIsMom };
};

export const deleteSubject = (
  SList: (Subject | Course)[],
  targetSet: Set<number>
): { newList: (Subject | Course)[] } => {
  const result = deleteFamily(SList, targetSet);
  return result;
};
