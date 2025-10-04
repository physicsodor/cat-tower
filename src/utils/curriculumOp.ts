import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import type { Curriculum } from "../types/Curriculum";
import { buildFamilyMap, getFlatIdxs } from "./familyOp";

type List = ReadonlyArray<Curriculum>;
type Target = ReadonlySet<number>;

const addSubject = (
  list: ReadonlyArray<Curriculum>
): { newIdx: number; newList: List } => {
  const idx2family = buildFamilyMap(list);
  let newIdx = 0;
  while (idx2family.has(newIdx)) newIdx++;
  const mom = -1;
  const lastBro = idx2family.get(mom)?.last ?? null;
  const newBro = generateKeyBetween(lastBro, null);
  const newList = [...list, getNewItem(newIdx, mom, newBro, "SUBJECT")];
  return { newIdx, newList };
};

const addCourse = (list: List, targetSet: Target): { newList: List } => {
  const idx2family = buildFamilyMap(list);
  let newIdx = 0;
  while (idx2family.has(newIdx)) newIdx++;
  const { commonMom, flatIdxs } = getFlatIdxs(idx2family, targetSet);
  const lastBro = idx2family.get(commonMom)?.last ?? null;
  const newBro = generateKeyBetween(lastBro, null);
  const bros = generateNKeysBetween(null, null, targetSet.size);
  const idx2bro = new Map<number, string>();
  for (let i = 0; i < flatIdxs.length; i++) idx2bro.set(flatIdxs[i], bros[i]);
  const newList: Curriculum[] = [];
  for (const x of list) {
    if (targetSet.has(x.idx)) newList.push({ ...x, mom: newIdx, bro: newBro });
    else newList.push(x);
  }
  newList.push(getNewItem(newIdx, commonMom, newBro, "COURSE"));
  return { newList };
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
        ttl: `Course ${idx}`,
        sbjType,
      }
    : {
        idx,
        mom,
        bro,
        pre: new Set(),
        ttl: `Subject ${idx}`,
        cnt: "",
        dsc: "",
        x: 0,
        y: 0,
        sbjType,
      };
};

export { addSubject, addCourse };
