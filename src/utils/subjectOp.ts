import {
  newCourse,
  newSubject,
  type Course,
  type Subject,
} from "../types/Subject";
import { addFamily, makeIdx2BroMap } from "./familyOp";

type SubjectList = (Subject | Course)[];

export const addSubject = (SList: SubjectList): SubjectList => {
  return addFamily(SList, newSubject, -1, false);
};

export const addCourse = (SList: SubjectList): SubjectList => {
  return addFamily(SList, newCourse, -1, true);
};

export const deleteSubject = (
  SList: SubjectList,
  targetSet: Set<number>
): SubjectList => {
  const idx2bro = makeIdx2BroMap(SList, targetSet);
  return SList.filter((x) => !targetSet.has(x.idx) || x.isMom).map((x) =>
    targetSet.has(x.bro) ? { ...x, bro: idx2bro.get(x.bro) ?? -1 } : x
  );
};
