import { isChain, type Chain } from "@/features/subject/types/Chain/Chain";
import type { IdxItem } from "@/features/subject/types/IdxItem/IdxItem";
import { setAdd } from "@/utils/setOp";

type ChainInfo = {
  pre?: Set<number>;
  nxt?: Set<number>;
  preSet?: Set<number>;
  nxtSet?: Set<number>;
};
type ChainMap = Map<number, ChainInfo>;

const buildChainMap = <T extends Chain, S extends IdxItem>(
  list: ReadonlyArray<T | S>
) => {
  const idx2chain = new Map<number, ChainInfo>();
  for (const x of list) {
    if (!isChain(x)) continue;
    const xInfo = idx2chain.get(x.idx) ?? {};
    if (x.pre.size > 0) xInfo.pre = new Set(x.pre);
    idx2chain.set(x.idx, xInfo);
    for (const pIdx of x.pre) {
      const pInfo = idx2chain.get(pIdx) ?? {};
      (pInfo.nxt ??= new Set()).add(x.idx);
      idx2chain.set(pIdx, pInfo);
    }
  }
  const _getSet = (
    idx: number,
    mode: "pre" | "nxt",
    visited: Set<number>
  ): Set<number> => {
    const info = idx2chain.get(idx);
    if (!info) return new Set();
    const near = mode === "pre" ? info.pre : info.nxt;
    if (!near) return new Set();
    const cached = mode === "pre" ? info.preSet : info.nxtSet;
    if (cached) return cached;
    if (visited.has(idx)) return new Set();
    visited.add(idx);
    const result = new Set<number>();
    for (const nIdx of near) {
      result.add(nIdx);
      setAdd(result, _getSet(nIdx, mode, visited));
    }
    if (mode === "pre") info.preSet = result;
    else info.nxtSet = result;
    idx2chain.set(idx, info);
    return result;
  };
  for (const x of list) {
    _getSet(x.idx, "pre", new Set());
    _getSet(x.idx, "nxt", new Set());
  }
  return idx2chain;
};

const setPre = <T extends Chain, S extends IdxItem>(
  idx2chain: ChainMap,
  idxFrom: number,
  idxTo: number
): { updater: (list: ReadonlyArray<T | S>) => (T | S)[] } => {
  const DEF = { updater: (list: ReadonlyArray<T | S>) => list as (T | S)[] };

  const fromChain = idx2chain.get(idxFrom);
  if (!fromChain) return DEF;
  const toChain = idx2chain.get(idxTo);
  if (!toChain) return DEF;

  // if idxFrom, idxTo make a cycle, then do not update.
  if (toChain.nxtSet?.has(idxFrom)) return DEF;

  // if idxFrom, idxTo make shortcuts, then remove the shortcuts.
  if (fromChain.nxtSet?.has(idxTo)) return DEF;
  const kill = new Map<number, number[]>();
  if (fromChain.nxt && toChain.nxtSet) {
    for (const n of fromChain.nxt) {
      if (toChain.nxtSet.has(n)) kill.set(n, [idxFrom]);
    }
  }
  if (fromChain.preSet) {
    const arr = [];
    for (const p of fromChain.preSet) {
      if (idx2chain.get(p)?.nxt?.has(idxTo)) arr.push(p);
    }
    if (arr.length > 0) kill.set(idxTo, arr);
  }

  const updater = (list: ReadonlyArray<T | S>) => {
    return list.map((x) => {
      if (!isChain<T>(x)) return x;
      const pre = new Set(x.pre);
      let noChange = true;
      if (x.idx === idxTo) {
        noChange = false;
        pre.add(idxFrom);
      }
      const k = kill.get(x.idx);
      if (k) {
        noChange = false;
        for (const i of k) pre.delete(i);
      }
      return noChange ? x : { ...x, pre };
    });
  };

  return { updater };
};

export type { ChainMap };
export { buildChainMap, setPre };
