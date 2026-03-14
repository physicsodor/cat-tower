import { isChain, type Chain } from "@/features/subject/types/Chain/Chain";
import type { IdxItem } from "@/features/subject/types/IdxItem/IdxItem";
import { setAdd, setDif } from "@/utils/setOp";

type ChainInfo = {
  pre?: Set<number>;
  nxt?: Set<number>;
  preSet?: Set<number>;
  nxtSet?: Set<number>;
};
type ChainMap = Map<number, ChainInfo>;

const buildChainMap = <T extends Chain, S extends IdxItem>(
  list: ReadonlyArray<T | S>,
) => {
  const idx2chain = new Map<number, ChainInfo>();
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

const setPre = <T extends Chain, S extends IdxItem>(
  idx2chain: ChainMap,
  idxFrom: number,
  idxTo: number,
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

const removePre = <T extends Chain, S extends IdxItem>(
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

const buildChainLevelMap = (idx2chain: ChainMap): Map<number, number> => {
  const idx2chainLevel = new Map<number, number>();

  // idx2chain의 대상이 되는 요소를 체인이라 하겠다.
  // 체인 A, B에 대해 A.pre.has(B.idx)라면 B→A라 하겠다.
  // B→A이면 B.nxt.has(A.idx)이다.
  // 체인은 acyclic하다.
  // 모든 체인은 level이 할당되어야 한다.
  // B→A이면 B.level < A.level이어야 한다.
  // (normalize) S = {x | A→...→x or x→...→A}이면 S의 원소들의 가장 작은 level은 0이어야 한다.
  // B→A일 때 B.level === A.level-1인 경우(tight edge)가 최대한 많아지도록 level을 할당해야 한다.
  // suffix tight를 선호한다.
  //   - DAG가 consistent(임의의 두 노드 사이의 모든 경로 길이가 같음)이면 모든 엣지를 tight하게 할 수 있다.
  //     이 경우 undirected BFS로 고유한 fully-tight 할당을 구한다.
  //   - inconsistent이면 ASAP → ALAP(suffix) 순으로 fallback한다.
  //     ALAP: 싱크의 레벨은 ASAP 값으로 고정, 비싱크는 min(후계자 레벨) - 1.
  // 확인: A→B→C, D→E→F→G, D→C, H→G → A=0,B=1,C=2,D=1,E=2,F=3,G=4,H=3 ✓

  if (idx2chain.size === 0) return idx2chainLevel;

  const globalVisited = new Set<number>();
  for (const startIdx of idx2chain.keys()) {
    if (globalVisited.has(startIdx)) continue;

    // ── 약연결 컴포넌트 탐색 ──
    const component: number[] = [];
    const compQ = [startIdx];
    globalVisited.add(startIdx);
    while (compQ.length > 0) {
      const v = compQ.shift()!;
      component.push(v);
      const info = idx2chain.get(v)!;
      for (const nb of [...(info.pre ?? []), ...(info.nxt ?? [])]) {
        if (idx2chain.has(nb) && !globalVisited.has(nb)) {
          globalVisited.add(nb);
          compQ.push(nb);
        }
      }
    }

    // ── fully-tight BFS 시도 (undirected: 순방향 +1, 역방향 -1) ──
    const tempLevel = new Map<number, number>([[startIdx, 0]]);
    let consistent = true;
    const tightQ = [startIdx];
    outer: while (tightQ.length > 0) {
      const v = tightQ.shift()!;
      const vLv = tempLevel.get(v)!;
      const info = idx2chain.get(v)!;
      for (const wIdx of info.nxt ?? []) {
        if (!idx2chain.has(wIdx)) continue;
        const exp = vLv + 1;
        if (!tempLevel.has(wIdx)) {
          tempLevel.set(wIdx, exp);
          tightQ.push(wIdx);
        } else if (tempLevel.get(wIdx) !== exp) {
          consistent = false;
          break outer;
        }
      }
      for (const uIdx of info.pre ?? []) {
        if (!idx2chain.has(uIdx)) continue;
        const exp = vLv - 1;
        if (!tempLevel.has(uIdx)) {
          tempLevel.set(uIdx, exp);
          tightQ.push(uIdx);
        } else if (tempLevel.get(uIdx) !== exp) {
          consistent = false;
          break outer;
        }
      }
    }

    if (consistent) {
      for (const idx of component) idx2chainLevel.set(idx, tempLevel.get(idx)!);
    } else {
      // ── fallback: ASAP → ALAP (suffix tight) ──

      // ASAP: 소스=0, 전방 Kahn's BFS
      const inDeg = new Map<number, number>();
      for (const idx of component) {
        let deg = 0;
        for (const p of idx2chain.get(idx)!.pre ?? [])
          if (idx2chain.has(p)) deg++;
        inDeg.set(idx, deg);
      }
      // partial BFS tempLevel을 정규화해 ASAP 하한으로 활용
      const tempMin = Math.min(...[...tempLevel.values()]);
      const asap = new Map<number, number>();
      for (const idx of component) {
        const tl = tempLevel.get(idx);
        asap.set(idx, tl !== undefined ? Math.max(0, tl - tempMin) : 0);
      }
      const asapQ = component.filter((idx) => inDeg.get(idx) === 0);
      while (asapQ.length > 0) {
        const v = asapQ.shift()!;
        const vLv = asap.get(v)!;
        for (const w of idx2chain.get(v)!.nxt ?? []) {
          if (!idx2chain.has(w)) continue;
          if (vLv + 1 > asap.get(w)!) asap.set(w, vLv + 1);
          const nd = inDeg.get(w)! - 1;
          inDeg.set(w, nd);
          if (nd === 0) asapQ.push(w);
        }
      }

      // 위상 정렬 (ALAP 역방향 처리를 위해)
      const inDeg2 = new Map<number, number>();
      for (const idx of component) {
        let deg = 0;
        for (const p of idx2chain.get(idx)!.pre ?? [])
          if (idx2chain.has(p)) deg++;
        inDeg2.set(idx, deg);
      }
      const topoOrder: number[] = [];
      const topoQ = component.filter((idx) => inDeg2.get(idx) === 0);
      while (topoQ.length > 0) {
        const v = topoQ.shift()!;
        topoOrder.push(v);
        for (const w of idx2chain.get(v)!.nxt ?? []) {
          if (!idx2chain.has(w)) continue;
          const nd = inDeg2.get(w)! - 1;
          inDeg2.set(w, nd);
          if (nd === 0) topoQ.push(w);
        }
      }

      // ALAP: 싱크는 ASAP 레벨 유지, 비싱크는 min(후계자.alap) - 1
      const alap = new Map<number, number>(asap);
      for (let i = topoOrder.length - 1; i >= 0; i--) {
        const v = topoOrder[i];
        const succs = [...(idx2chain.get(v)!.nxt ?? [])].filter((w) =>
          idx2chain.has(w),
        );
        if (succs.length > 0)
          alap.set(v, Math.min(...succs.map((w) => alap.get(w)!)) - 1);
      }

      for (const idx of component) idx2chainLevel.set(idx, alap.get(idx)!);
    }

    // ── normalize: 컴포넌트 최솟값을 0으로 ──
    const minLevel = Math.min(
      ...component.map((idx) => idx2chainLevel.get(idx)!),
    );
    if (minLevel !== 0)
      for (const idx of component)
        idx2chainLevel.set(idx, idx2chainLevel.get(idx)! - minLevel);
  }

  return idx2chainLevel;
};

export type { ChainMap };
export { buildChainMap, setPre, removePre, buildChainLevelMap };
