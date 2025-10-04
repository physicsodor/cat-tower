import type { Family } from "../types/Family";

type FamilyInfo = {
  mom?: number;
  bro?: string;
  kids?: number[];
  left?: string;
  right?: string;
  first?: string;
  last?: string;
};
type FamilyMap = ReadonlyMap<number, FamilyInfo>;

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
  const _cmp = (a: number, b: number) => {
    const broA = idx2info.get(a)?.bro ?? "";
    const broB = idx2info.get(b)?.bro ?? "";
    return broA === broB ? 0 : broA < broB ? -1 : 1;
  };
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
      info = idx2info.get(idx) ?? {};
      const left = idx2info.get(kids[i - 1])?.bro;
      const right = idx2info.get(kids[i + 1])?.bro;
      if (left) info.left = left;
      if (right) info.right = right;
      idx2info.set(idx, info);
    }
  }
  return idx2info;
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
    if (commonMom === -1 && n === targetSet.size && !targetSet.has(mom)) {
      commonMom = mom;
    }
    return n;
  };
  _push(-1);
  return { commonMom, flatIdxs };
};

export { buildFamilyMap, getFlatIdxs };
