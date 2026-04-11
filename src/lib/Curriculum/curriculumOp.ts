import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import type { Curriculum, Subject, Course, SbjMap } from "./curriculum";
import { getNewIdx } from "@/lib/IdxItem/idxItemOp";
import { getFlatIdxs, reparentKids } from "@/lib/Family/familyOp";
import type { FamilyMap } from "@/lib/Family/family";
import { removePre } from "@/lib/Chain/chainOp";

export const normalizeCenter = (list: ReadonlyArray<Curriculum>): ReadonlyArray<Curriculum> => {
  const subjects = list.filter((c): c is Subject => c.sbjType === "SUBJECT");
  if (subjects.length === 0) return list;
  const xs = subjects.map((s) => s.x);
  const ys = subjects.map((s) => s.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  if (cx === 0 && cy === 0) return list;
  return list.map((c) => c.sbjType === "SUBJECT" ? { ...c, x: c.x - cx, y: c.y - cy } : c);
};

export const buildSbjMap = (list: ReadonlyArray<Curriculum>): SbjMap => {
  const idx2sbj = new Map<number, import("./curriculum").SbjInfo>();
  for (const item of list) {
    const { title, sbjType } = item;
    if (sbjType === "COURSE")
      idx2sbj.set(item.idx, { title, sbjType, short: item.short });
    else {
      const { content, x, y, short } = item;
      idx2sbj.set(item.idx, { title, sbjType, content, x, y, short });
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
        tag: new Set(),
      };
};
