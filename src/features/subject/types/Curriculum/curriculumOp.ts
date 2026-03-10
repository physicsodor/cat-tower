import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import type {
  Course,
  Curriculum,
  Subject,
} from "@/features/subject/types/Curriculum/Curriculum";
import {
  getFlatIdxs,
  reparentKids,
  type FamilyMap,
} from "@/features/subject/types/Family/familyOp";
import { getNewIdx } from "../IdxItem/idxItemOp";
import { removePre } from "../Chain/chainOp";

type SbjInfo =
  | { sbjType: "COURSE"; title: string }
  | {
      sbjType: "SUBJECT";
      title: string;
      short?: string;
      content: string;
      description: string;
      x: number;
      y: number;
    };
// type SbjMap = ReadonlyMap<number, SbjInfo>;

const buildSbjMap = (list: ReadonlyArray<Curriculum>): Map<number, SbjInfo> => {
  const idx2sbj = new Map<number, SbjInfo>();
  for (const item of list) {
    const { title, sbjType } = item;
    if (sbjType === "COURSE") idx2sbj.set(item.idx, { title, sbjType });
    else {
      const { content, description, x, y, short } = item;
      idx2sbj.set(item.idx, { title, sbjType, content, description, x, y, short });
    }
  }
  return idx2sbj;
};

const addSubject = (
  idx2family: FamilyMap,
  x: number,
  y: number,
): {
  newIdx: number;
  updater: (list: ReadonlyArray<Curriculum>) => Curriculum[];
} => {
  const newIdx = getNewIdx(idx2family);
  const mom = -1;
  const lastBro = idx2family.get(mom)?.last ?? null;
  const newBro = generateKeyBetween(lastBro, null);
  const newItem = getNewItem(newIdx, mom, newBro, "SUBJECT", x, y);
  const updater = (list: ReadonlyArray<Curriculum>) => [...list, newItem];
  return { newIdx, updater };
};

const addCourse = (
  idx2family: FamilyMap,
  targetSet: ReadonlySet<number>,
): { updater: (list: ReadonlyArray<Curriculum>) => Curriculum[] } => {
  const newIdx = getNewIdx(idx2family);
  const { commonMom, flatIdxs } = getFlatIdxs(idx2family, targetSet);
  const lastBro = idx2family.get(commonMom)?.last ?? null;
  const newBro = generateKeyBetween(lastBro, null);
  const bros = generateNKeysBetween(null, null, targetSet.size);
  const idx2bro = new Map(flatIdxs.map((x, i) => [x, bros[i]]));
  const updater = (list: ReadonlyArray<Curriculum>) => {
    const newList: Curriculum[] = [];
    for (const x of list) {
      if (targetSet.has(x.idx))
        newList.push({ ...x, mom: newIdx, bro: idx2bro.get(x.idx) ?? "" });
      else newList.push(x);
    }
    newList.push(getNewItem(newIdx, commonMom, newBro, "COURSE"));
    return newList;
  };
  return { updater };
};

const deleteSubject = (
  targetSet: ReadonlySet<number>,
): { updater: (list: ReadonlyArray<Curriculum>) => Curriculum[] } => {
  const { updater: cleanPre } = removePre<Subject, Course>(targetSet);
  const updater = (list: ReadonlyArray<Curriculum>) =>
    cleanPre(list.filter((x) => !targetSet.has(x.idx))) as Curriculum[];
  return { updater };
};

const deleteCourse = (idx2family: FamilyMap, idx: number) =>
  reparentKids<Curriculum>(idx2family, idx);

const getNewItem = (
  idx: number,
  mom: number,
  bro: string,
  sbjType: Curriculum["sbjType"],
  x = 0,
  y = 0,
): Curriculum => {
  return sbjType === "COURSE"
    ? {
        idx,
        mom,
        bro,
        title: `Course ${idx}`,
        sbjType,
      }
    : {
        idx,
        mom,
        bro,
        pre: new Set(),
        title: `Subject ${idx}`,
        content: "",
        description: "",
        x,
        y,
        sbjType,
      };
};

export {
  buildSbjMap,
  type SbjInfo,
  addSubject,
  addCourse,
  deleteSubject,
  deleteCourse,
};
