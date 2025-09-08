import {
  type Course,
  type Curriculum,
  type Subject,
} from "../types/Curriculum";
import type { Family } from "../types/Family";
import { deleteChain, replaceChain } from "./chainOp";
import { addFamily, deleteFamily } from "./familyOp";

const generateSubjectByFamily = (s: Family): Subject => ({
  ...s,
  cnt: "",
  dsc: "",
  pre: new Set(),
  sbjType: "Subject",
  ttl: `Subject ${s.idx}`,
  x: 0,
  y: 0,
});

const generateCourseByFamily = (s: Family): Course => ({
  ...s,
  sbjType: "Course",
  ttl: `Course ${s.idx}`,
});

export const generateCourseByTitle = (ttl: string): Course => ({
  ttl,
  bro: "",
  idx: -1,
  mom: -1,
  sbjType: "Course",
});

export const addSubject = (
  TList: Curriculum[]
): { newIdx: number; newList: Curriculum[] } => {
  const result = addFamily(TList, generateSubjectByFamily, -1);
  result.newList = replaceChain<Subject, Course>(
    result.newList,
    result.newIdx
  ).newList;

  return result;
};

export const addCourse = (
  TList: Curriculum[]
): { newIdx: number; newList: Curriculum[] } => {
  const result = addFamily(TList, generateCourseByFamily, -1);
  result.newList = replaceChain<Subject, Course>(
    result.newList,
    result.newIdx
  ).newList;

  return result;
};

export const deleteCurriculum = (
  TList: Curriculum[],
  targetSet: Set<number>
): { newList: Curriculum[] } => {
  const result = deleteFamily(TList, targetSet);
  const newList = deleteChain<Subject, Course>(
    result.newList,
    targetSet
  ).newList;
  return { newList };
};

export const setSubjectXY = (
  TList: Curriculum[],
  targetSet: Set<number>,
  dxy: { x: number; y: number }
): { newList: Curriculum[] } => {
  console.log(dxy.x, dxy.y);
  const newList = TList.map((t) =>
    targetSet.has(t.idx) && t.sbjType === "Subject"
      ? { ...t, x: t.x + dxy.x, y: t.y + dxy.y }
      : t
  );
  return { newList };
};
