import type { IdxItem } from "@/lib/IdxItem/idxItem";
import type { Chain, ChainMap } from "./chain";
import { setAdd, setDif } from "@/utils/setOp";

const isChain = <T extends Chain>(x: unknown): x is T =>
  !!x && typeof x === "object" && "pre" in (x as object);

export const buildChainMap = <T extends Chain, S extends IdxItem>(
  list: ReadonlyArray<T | S>,
): ChainMap => {
  const idx2chain: ChainMap = new Map();
  for (const x of list) {
    if (!isChain<T>(x)) continue;
    const xInfo = idx2chain.get(x.idx) ?? {};
    xInfo.pre = new Set(x.pre);
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
    visited: Set<number>,
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

export const setPre = <T extends Chain, S extends IdxItem>(
  idx2chain: ChainMap,
  idxFrom: number,
  idxTo: number,
): { updater: (list: ReadonlyArray<T | S>) => (T | S)[] } => {
  const DEF = { updater: (list: ReadonlyArray<T | S>) => list as (T | S)[] };

  const fromChain = idx2chain.get(idxFrom);
  if (!fromChain) return DEF;
  const toChain = idx2chain.get(idxTo);
  if (!toChain) return DEF;

  if (toChain.nxtSet?.has(idxFrom)) return DEF;
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

  const updater = (list: ReadonlyArray<T | S>) =>
    list.map((x) => {
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

  return { updater };
};

export const removePre = <T extends Chain, S extends IdxItem>(
  targetSet: ReadonlySet<number>,
): { updater: (list: ReadonlyArray<T | S>) => (T | S)[] } => {
  const updater = (list: ReadonlyArray<T | S>) =>
    list.map((x) => {
      if (!isChain<T>(x)) return x;
      const pre = setDif(x.pre, targetSet);
      return pre.size === x.pre.size ? x : { ...x, pre };
    });
  return { updater };
};

export const getPartition = (
  idx2chain: ChainMap,
  ids: number[],
): number[][] => {
  const idSet = new Set(ids);
  const adj = new Map<number, Set<number>>();
  for (const idx of idSet) adj.set(idx, new Set<number>());
  for (const idx of idSet) {
    for (const j of idx2chain.get(idx)?.nxt ?? []) {
      if (!idSet.has(j)) continue;
      adj.get(idx)!.add(j);
      adj.get(j)!.add(idx);
    }
  }
  const visited = new Set<number>();
  const comps: number[][] = [];
  for (const start of ids) {
    if (visited.has(start)) continue;
    const comp: number[] = [];
    const stack = [start];
    visited.add(start);
    while (stack.length) {
      const cur = stack.pop()!;
      comp.push(cur);
      for (const nb of adj.get(cur)!) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        stack.push(nb);
      }
    }
    comps.push(comp);
  }
  return comps;
};
