import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";
import {
  getFlatIdxs,
  type FamilyMap,
} from "@/features/subject/types/Family/familyOp";
import { setDif } from "@/utils/setOp";

type SbjInfo =
  | { sbjType: "COURSE"; title: string }
  | {
      sbjType: "SUBJECT";
      title: string;
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
      const { content, description, x, y } = item;
      idx2sbj.set(item.idx, { title, sbjType, content, description, x, y });
    }
  }
  return idx2sbj;
};

const addSubject = (
  idx2family: FamilyMap
): {
  newIdx: number;
  updater: (list: ReadonlyArray<Curriculum>) => Curriculum[];
} => {
  let newIdx = 0;
  while (idx2family.has(newIdx)) newIdx++;
  const mom = -1;
  const lastBro = idx2family.get(mom)?.last ?? null;
  const newBro = generateKeyBetween(lastBro, null);
  const newItem = getNewItem(newIdx, mom, newBro, "SUBJECT");
  const updater = (list: ReadonlyArray<Curriculum>) => [...list, newItem];
  return { newIdx, updater };
};

const addCourse = (
  idx2family: FamilyMap,
  targetSet: ReadonlySet<number>
): { updater: (list: ReadonlyArray<Curriculum>) => Curriculum[] } => {
  let newIdx = 0;
  while (idx2family.has(newIdx)) newIdx++;
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
  targetSet: ReadonlySet<number>
): { updater: (list: ReadonlyArray<Curriculum>) => Curriculum[] } => {
  const updater = (list: ReadonlyArray<Curriculum>) => {
    const newList: Curriculum[] = [];
    for (const x of list) {
      if (targetSet.has(x.idx)) continue;
      if (x.sbjType === "COURSE") newList.push(x);
      else {
        const pre = setDif(x.pre, targetSet);
        newList.push({ ...x, pre });
      }
    }
    return newList;
  };
  return { updater };
};

const deleteCourse = (
  idx2family: FamilyMap,
  idx: number
): {
  updater: (list: ReadonlyArray<Curriculum>) => Curriculum[];
} => {
  const info = idx2family.get(idx);
  if (!info) return { updater: (x) => x as Curriculum[] };
  const mom = info.mom ?? -1;
  const kids = info.kids ?? [];
  const left = info.left ?? null;
  const right = info.right ?? null;
  const bros = generateNKeysBetween(left, right, kids.length);
  const idx2bro = new Map(kids.map((k, i) => [k, bros[i]]));
  const updater = (list: ReadonlyArray<Curriculum>) => {
    const newList: Curriculum[] = [];
    for (const x of list) {
      if (x.idx === idx) continue;
      if (x.mom === idx)
        newList.push({ ...x, mom, bro: idx2bro.get(x.idx) ?? "" });
      else newList.push(x);
    }
    return newList;
  };
  return { updater };
};

const getNewItem = (
  idx: number,
  mom: number,
  bro: string,
  sbjType: Curriculum["sbjType"]
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
        x: 0,
        y: 0,
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
