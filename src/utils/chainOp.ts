import { isChain, type Chain } from "../types/Chain";
import { makeIdx2Item } from "./idxItemOp";
import { setDif } from "./setOp";

type NewInfo = Partial<Chain>;

export const getPreSet = <T extends Chain>(
  TList: T[],
  pivotIdx: number
): Set<number> => {
  const idx2item = makeIdx2Item(TList);
  const pivot = idx2item.get(pivotIdx);
  if (!pivot) return new Set();
  const preSet = new Set<number>();
  const pushItems = (testSet: Set<number>) => {
    for (const idx of testSet) {
      const x = idx2item.get(idx);
      if (!x || preSet.has(x.idx)) continue;
      preSet.add(x.idx);
      if (x.pre.size > 0) pushItems(x.pre);
    }
  };
  pushItems(pivot.pre);
  return preSet;
};

const deleteChainMap = <T extends Chain, S>(
  idx2item: ReadonlyMap<number, T | S>,
  targetSet: ReadonlySet<number>
): Map<number, NewInfo> => {
  const idx2new = new Map<number, NewInfo>();
  for (const [idx, t] of idx2item) {
    if (!isChain(t) || targetSet.has(t.idx)) continue;
    idx2new.set(idx, { pre: setDif(t.pre, targetSet) });
  }
  return idx2new;
};

export { deleteChainMap };
