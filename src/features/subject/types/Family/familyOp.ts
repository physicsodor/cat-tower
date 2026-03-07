import { generateNKeysBetween } from "fractional-indexing";
import type { Family, FamilyInfo, FamilyMap, BroDir } from "@/features/subject/types/Family/Family";

const buildFamilyMap = <T extends Family>(
  list: ReadonlyArray<T>
): FamilyMap => {
  const idx2kids = new Map<number, number[]>();
  const idx2info = new Map<number, FamilyInfo>();
  for (const x of list) {
    idx2info.set(x.idx, { mom: x.mom, bro: x.bro });
    const kids = idx2kids.get(x.mom) ?? [];
    kids.push(x.idx);
    idx2kids.set(x.mom, kids);
  }
  for (const [idx, kids] of idx2kids) {
    if (kids.length === 0) continue;
    let info = idx2info.get(idx) ?? {};
    kids.sort(_cmp);
    const first = idx2info.get(kids[0])?.bro;
    const last = idx2info.get(kids[kids.length - 1])?.bro;
    info.kids = kids;
    if (first) info.first = first;
    if (last) info.last = last;
    idx2info.set(idx, info);

    for (let i = 0; i < kids.length; i++) {
      info = idx2info.get(kids[i]) ?? {};
      const left = idx2info.get(kids[i - 1])?.bro;
      const right = idx2info.get(kids[i + 1])?.bro;
      if (left) info.left = left;
      if (right) info.right = right;
      idx2info.set(kids[i], info);
    }
  }
  function _cmp(a: number, b: number) {
    const broA = idx2info.get(a)?.bro ?? "";
    const broB = idx2info.get(b)?.bro ?? "";
    return broA === broB ? 0 : broA < broB ? -1 : 1;
  }
  return idx2info;
};

const setMom = <T extends Family>(
  idx2family: FamilyMap,
  targetSet: ReadonlySet<number>,
  mom: number
): { updater: (list: ReadonlyArray<T>) => T[] } => {
  if (isMomCyclic(idx2family, targetSet, mom))
    return { updater: (x) => x as T[] };
  const { flatIdxs } = getFlatIdxs(idx2family, targetSet);
  const firstBro = idx2family.get(mom)?.first ?? null;
  const bros = generateNKeysBetween(null, firstBro, targetSet.size);
  const idx2bro = new Map(flatIdxs.map((x, i) => [x, bros[i]]));
  const updater = (list: ReadonlyArray<T>) =>
    list.map((x) =>
      targetSet.has(x.idx) ? { ...x, mom, bro: idx2bro.get(x.idx) ?? "" } : x
    );
  return { updater };
};

const setBro = <T extends Family>(
  idx2family: FamilyMap,
  targetSet: ReadonlySet<number>,
  idx: number,
  dir: BroDir
): { updater: (list: ReadonlyArray<T>) => T[] } => {
  const info = idx2family.get(idx);
  if (!info) return { updater: (x) => x as T[] };
  const mom = info.mom ?? -1;
  if (isMomCyclic(idx2family, targetSet, mom))
    return { updater: (x) => x as T[] };
  const bro = info.bro ?? null;
  const left = dir === "LEFT" ? info.left ?? null : bro;
  const right = dir === "LEFT" ? bro : info.right ?? null;
  const bros = generateNKeysBetween(left, right, targetSet.size);
  const { flatIdxs } = getFlatIdxs(idx2family, targetSet);
  const idx2bro = new Map(flatIdxs.map((x, i) => [x, bros[i]]));
  const updater = (list: ReadonlyArray<T>) =>
    list.map((x) =>
      targetSet.has(x.idx) ? { ...x, mom, bro: idx2bro.get(x.idx) ?? "" } : x
    );
  return { updater };
};

const isMomCyclic = (
  idx2family: FamilyMap,
  targetSet: ReadonlySet<number>,
  mom: number
): boolean => {
  let testMom = mom;
  const visited = new Set(targetSet);
  while (testMom >= 0) {
    if (visited.has(testMom)) return true;
    visited.add(testMom);
    testMom = idx2family.get(testMom)?.mom ?? -1;
  }
  return false;
};

const getFlatIdxs = (
  idx2family: FamilyMap,
  targetSet: ReadonlySet<number>
): { commonMom: number; flatIdxs: number[] } => {
  const flatIdxs: number[] = [];
  let commonMom = -1;
  if (targetSet.size === 0) return { commonMom, flatIdxs };
  const _push = (mom: number) => {
    let n = targetSet.has(mom) ? 1 : 0;
    const kids = idx2family.get(mom)?.kids ?? [];
    for (const kid of kids) {
      if (targetSet.has(kid)) flatIdxs.push(kid);
      n += _push(kid);
    }
    if (commonMom === -1 && n === targetSet.size && !targetSet.has(mom))
      commonMom = mom;
    return n;
  };
  _push(-1);
  return { commonMom, flatIdxs };
};

export type { FamilyMap, BroDir };
export { buildFamilyMap, setMom, setBro, getFlatIdxs };
