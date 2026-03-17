import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import type { Chain } from "@/lib/Chain/chain";
import { removePre } from "@/lib/Chain/chain";
import { type Family, type FamilyMap, getFlatIdxs, reparentKids } from "@/lib/Family/family";
import { getNewIdx } from "@/lib/IdxItem/idxItem";

export type Curriculum = Subject | Course;

export interface Subject extends Family, Chain {
  title: string;
  short?: string;
  content: string;
  x: number;
  y: number;
  sbjType: "SUBJECT";
}

export interface Course extends Family {
  title: string;
  short?: string;
  sbjType: "COURSE";
}

type SbjInfo =
  | { sbjType: "COURSE"; title: string; short?: string }
  | {
      sbjType: "SUBJECT";
      title: string;
      short?: string;
      content: string;
      x: number;
      y: number;
    };
export type SbjMap = ReadonlyMap<number, SbjInfo>;
export type { SbjInfo };

export const buildSbjMap = (list: ReadonlyArray<Curriculum>): SbjMap => {
  const idx2sbj = new Map<number, SbjInfo>();
  for (const item of list) {
    const { title, sbjType } = item;
    if (sbjType === "COURSE")
      idx2sbj.set(item.idx, { title, sbjType, short: item.short });
    else {
      const { content, x, y, short } = item;
      idx2sbj.set(item.idx, {
        title,
        sbjType,
        content,
        x,
        y,
        short,
      });
    }
  }
  return idx2sbj;
};

export const addSubject = (
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

export const addCourse = (
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

export const deleteSubject = (
  targetSet: ReadonlySet<number>,
): { updater: (list: ReadonlyArray<Curriculum>) => Curriculum[] } => {
  const { updater: cleanPre } = removePre<Subject, Course>(targetSet);
  const updater = (list: ReadonlyArray<Curriculum>) => {
    let result = cleanPre(
      list.filter((x) => !targetSet.has(x.idx)),
    ) as Curriculum[];
    let changed = true;
    while (changed) {
      const hasKid = new Set<number>();
      for (const item of result) hasKid.add(item.mom);
      const emptyCourses = new Set(
        result
          .filter((x) => x.sbjType === "COURSE" && !hasKid.has(x.idx))
          .map((x) => x.idx),
      );
      if (emptyCourses.size === 0) {
        changed = false;
        break;
      }
      result = result.filter((x) => !emptyCourses.has(x.idx));
    }
    return result;
  };
  return { updater };
};

export const deleteCourse = (idx2family: FamilyMap, idx: number) =>
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
        x,
        y,
        sbjType,
      };
};
