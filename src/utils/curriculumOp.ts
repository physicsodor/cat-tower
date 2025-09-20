import {
  type Course,
  type Curriculum,
  type Subject,
} from "../types/Curriculum";
import { deleteChainMap } from "./chainOp";
import { deleteFamilyMap, getNewBro } from "./familyOp";
import {
  getNewIdx,
  makeIdx2Item,
  modifyItems,
  updateIdx2New,
} from "./idxItemOp";

type NewInfo = Partial<Curriculum>;

const newSubject = (list: ReadonlyArray<Curriculum>): Subject => {
  const idx = getNewIdx(list);
  const mom = -1;
  const bro = getNewBro(list, mom);
  return {
    idx,
    mom,
    bro,
    pre: new Set<number>(),
    ttl: `Subject ${idx}`,
    cnt: "",
    dsc: "",
    x: 0,
    y: 0,
    sbjType: "SUBJECT",
  };
};
const newCourse = (list: ReadonlyArray<Curriculum>): Course => {
  const idx = getNewIdx(list);
  const mom = -1;
  const bro = getNewBro(list, mom);
  return {
    idx,
    mom,
    bro,
    ttl: `Course ${idx}`,
    sbjType: "COURSE",
  };
};

const deleteCurriculum = (
  list: Curriculum[],
  targetSet: Set<number>
): Curriculum[] => {
  const idx2item = makeIdx2Item(list);
  const idx2new = new Map<number, NewInfo | null>();
  for (const idx of targetSet) idx2new.set(idx, null);
  updateIdx2New(idx2new, deleteFamilyMap(idx2item, targetSet));
  updateIdx2New(idx2new, deleteChainMap(idx2item, targetSet));
  return modifyItems(list, idx2new);
};

export const setSubjectXY = (
  TList: Curriculum[],
  targetSet: Set<number>,
  dxy: { x: number; y: number }
): { newList: Curriculum[] } => {
  if (targetSet.size === 0 || (dxy.x === 0 && dxy.y === 0)) {
    return { newList: TList };
  }

  let isChanged = false;
  const newList = TList.map((t) => {
    if (targetSet.has(t.idx) && t.sbjType === "SUBJECT") {
      isChanged = true;
      return { ...t, x: t.x + dxy.x, y: t.y + dxy.y };
    }
    return t;
  });
  return { newList: isChanged ? newList : TList };
};

export { newSubject, newCourse, deleteCurriculum };
