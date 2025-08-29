import { newSubject, type Course, type Subject } from "../types/Subject";
import { addFamily, deleteFamily } from "./familyOp";

type TheList = (Subject | Course)[];
type TheAdd = { newIdx: number; newList: TheList; newIsMom: boolean };

export const addSubject = (SList: TheList): TheAdd => {
  const newIsMom = false;
  return { ...addFamily(SList, newSubject, -1, newIsMom), newIsMom: newIsMom };
};

export const addCourse = (SList: TheList): TheAdd => {
  const newIsMom = true;
  const result = addFamily(SList, newSubject, -1, newIsMom);
  return { ...result, newIsMom: newIsMom };
};

export const deleteSubject = (
  SList: TheList,
  targetSet: Set<number>
): { newList: TheList } => {
  const result = deleteFamily(SList, targetSet);
  return result;
};
