import { type Family } from "../types/Family";
import { addIdxItem, makeIdx2ItemMap } from "./idxItemOp";

export const getNewBro = <T extends Family>(
  TList: T[],
  mom = -1,
  ignore?: Set<number>
) => {
  const broList = TList.filter((t) => t.mom === mom);
  if (broList.length === 0) return -1;

  const broMap = new Map<number, number>();
  for (const x of broList) broMap.set(x.bro, x.idx);

  let nBro = -1;
  if (!ignore || ignore.size === 0) {
    while (broMap.has(nBro)) nBro = broMap.get(nBro)!;
    return nBro;
  }
  let nnBro = broMap.get(nBro);
  while (true) {
    while (nnBro !== undefined && ignore.has(nnBro)) {
      nnBro = broMap.get(nnBro);
    }
    if (nnBro === undefined) return nBro;
    nBro = nnBro;
    nnBro = broMap.get(nBro);
  }
};

export const makeIdx2BroMap = <T extends Family>(
  TList: T[],
  ignore: Set<number> = new Set()
) => {
  const result = new Map<number, number>();
  const idx2Item = makeIdx2ItemMap(TList);

  for (const x of TList) {
    if (!ignore.has(x.idx)) continue;
    let b = x.bro;
    while (b >= 0 && ignore.has(b)) {
      b = idx2Item.get(b)?.bro ?? -1;
    }
    result.set(x.idx, b);
  }
  return result;
};

export const addFamily = <T extends Family>(
  TList: T[],
  newT: (s: Family) => T,
  mom: number,
  isMom: boolean
): T[] => {
  return addIdxItem(TList, (idx) =>
    newT({
      idx,
      mom,
      bro: getNewBro(TList, mom),
      isMom,
    })
  );
};
