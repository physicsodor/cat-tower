import { isChain, type Chain } from "../types/Chain";
import type { IdxItem } from "../types/IdxItem";
import { setAdd } from "./setOp";

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
  list: ReadonlyArray<T | S>,
  idxFrom: number,
  idxTo: number
): { newList: (T | S)[] } => {
  if (idxFrom < 0) return { newList: list as (T | S)[] };
  const idx2chain = buildChainMap<T, S>(list);
  const newList = [...list];
  return { newList };
};

export { buildChainMap, setPre };
