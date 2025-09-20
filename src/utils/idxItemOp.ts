import { type IdxItem } from "../types/IdxItem";

const getItemByIdx = <T extends IdxItem>(
  list: ReadonlyArray<T>,
  idx: number
): T | undefined => {
  return list.find((t) => t.idx === idx);
};

const makeIdx2Item = <T extends IdxItem>(
  list: ReadonlyArray<T>
): Map<number, T> => new Map(list.map((x) => [x.idx, x]));

const getNewIdx = <T extends IdxItem>(list: ReadonlyArray<T>): number => {
  const idxSet = new Set(list.map((t) => t.idx));
  let i = 0;
  while (idxSet.has(i)) i++;
  return i;
};

const modifyItems = <T extends IdxItem>(
  list: ReadonlyArray<T>,
  idx2new: ReadonlyMap<number, Partial<T> | null>
): T[] => {
  const targetSet = new Set(idx2new.keys());
  const visited = new Set<number>();
  const result: T[] = [];
  for (const t of list) {
    if (visited.has(t.idx)) continue;
    visited.add(t.idx);
    if (targetSet.has(t.idx)) {
      const nInfo = idx2new.get(t.idx);
      if (!nInfo) continue;
      result.push({ ...t, ...nInfo });
    } else result.push(t);
  }
  return result;
};

const updateIdx2New = <T extends IdxItem>(
  p: Map<number, Partial<T> | null>,
  n: ReadonlyMap<number, Partial<T> | null>
) => {
  for (const [idx, nInfo] of n) {
    const pInfo = p.get(idx);
    if (!pInfo) p.set(idx, nInfo);
    else p.set(idx, { ...pInfo, ...nInfo });
  }
};

export { getItemByIdx, getNewIdx, makeIdx2Item, modifyItems, updateIdx2New };
