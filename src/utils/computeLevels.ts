import type { ChainMap } from "@/lib/Chain/chain";

type PartGraph = {
  ids: number[];
  idSet: Set<number>;
  outAdj: Map<number, number[]>;
  inAdj: Map<number, number[]>;
  udAdj: Map<number, number[]>;
};

type Rule2Binding = {
  parent: number;
  child: number;
};

const buildPartGraph = (idx2chain: ChainMap, ids: number[]): PartGraph => {
  const idSet = new Set(ids);
  const outAdj = new Map<number, number[]>();
  const inAdj = new Map<number, number[]>();
  const udAdj = new Map<number, number[]>();

  for (const id of ids) {
    outAdj.set(id, []);
    inAdj.set(id, []);
    udAdj.set(id, []);
  }

  for (const id of ids) {
    const nxt = idx2chain.get(id)?.nxt ?? new Set<number>();
    for (const j of nxt) {
      if (!idSet.has(j)) continue;
      outAdj.get(id)!.push(j);
      inAdj.get(j)!.push(id);
      udAdj.get(id)!.push(j);
      udAdj.get(j)!.push(id);
    }
  }

  return { ids, idSet, outAdj, inAdj, udAdj };
};

const computeComponentsWithoutNode = (
  graph: PartGraph,
  removed: number,
): Map<number, number> => {
  const comp = new Map<number, number>();
  let compId = 0;

  for (const start of graph.ids) {
    if (start === removed) continue;
    if (comp.has(start)) continue;

    const q: number[] = [start];
    comp.set(start, compId);

    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      for (const nxt of graph.udAdj.get(cur) ?? []) {
        if (nxt === removed) continue;
        if (comp.has(nxt)) continue;
        comp.set(nxt, compId);
        q.push(nxt);
      }
    }

    compId++;
  }

  return comp;
};

/*
Rule 2:
A -> B and
for every sibling C in A.nxt \ {B},
for every D in B.nxt,
not ( D ~...(-A)~ C )
=> A.level = B.level - 1
*/
const canBindByRule2 = (
  graph: PartGraph,
  a: number,
  b: number,
  compWithoutA: Map<number, number>,
): boolean => {
  const siblings = (graph.outAdj.get(a) ?? []).filter((x) => x !== b);
  if (siblings.length === 0) return true;

  const siblingCompSet = new Set<number>();
  for (const c of siblings) {
    const cc = compWithoutA.get(c);
    if (cc !== undefined) siblingCompSet.add(cc);
  }

  // Vacuous true if B is sink inside this partition.
  for (const d of graph.outAdj.get(b) ?? []) {
    const dc = compWithoutA.get(d);
    if (dc !== undefined && siblingCompSet.has(dc)) return false;
  }

  return true;
};

const collectRule2Bindings = (graph: PartGraph): Rule2Binding[] => {
  const bindings: Rule2Binding[] = [];

  for (const a of graph.ids) {
    const children = graph.outAdj.get(a) ?? [];
    if (children.length === 0) continue;

    const compWithoutA = computeComponentsWithoutNode(graph, a);
    for (const b of children) {
      if (canBindByRule2(graph, a, b, compWithoutA)) {
        bindings.push({ parent: a, child: b });
      }
    }
  }

  return bindings;
};

class WeightedDSU {
  private parent = new Map<number, number>();
  private size = new Map<number, number>();
  private diffToParent = new Map<number, number>();
  // diffToParent[x] = level(x) - level(parent[x])

  constructor(ids: number[]) {
    for (const id of ids) {
      this.parent.set(id, id);
      this.size.set(id, 1);
      this.diffToParent.set(id, 0);
    }
  }

  find(x: number): { root: number; diff: number } {
    const p = this.parent.get(x);
    if (p === undefined) throw new Error(`WeightedDSU.find: unknown id ${x}`);
    if (p === x) return { root: x, diff: 0 };

    const res = this.find(p);
    const curDiff = this.diffToParent.get(x)!;
    const total = curDiff + res.diff;

    this.parent.set(x, res.root);
    this.diffToParent.set(x, total);

    return { root: res.root, diff: total };
  }

  same(x: number, y: number): boolean {
    return this.find(x).root === this.find(y).root;
  }

  /*
    Enforce:
      level(x) - level(y) = delta
  */
  unionWithDelta(x: number, y: number, delta: number): boolean {
    const fx = this.find(x);
    const fy = this.find(y);

    if (fx.root === fy.root) {
      const existing = fx.diff - fy.diff;
      if (existing !== delta) {
        throw new Error(
          `WeightedDSU contradiction: ${x} - ${y} expected ${delta}, got ${existing}`,
        );
      }
      return false;
    }

    const sx = this.size.get(fx.root) ?? 1;
    const sy = this.size.get(fy.root) ?? 1;

    // Want to set relation between roots.
    // If attaching rx under ry:
    // level(rx) - level(ry) = delta - fx.diff + fy.diff
    const rootDelta = delta - fx.diff + fy.diff;

    if (sx < sy) {
      this.parent.set(fx.root, fy.root);
      this.diffToParent.set(fx.root, rootDelta);
      this.size.set(fy.root, sx + sy);
    } else {
      // Attach ry under rx.
      // Then level(ry) - level(rx) = -rootDelta
      this.parent.set(fy.root, fx.root);
      this.diffToParent.set(fy.root, -rootDelta);
      this.size.set(fx.root, sx + sy);
    }

    return true;
  }

  diff(x: number, y: number): number | null {
    const fx = this.find(x);
    const fy = this.find(y);
    if (fx.root !== fy.root) return null;
    return fx.diff - fy.diff;
  }

  groups(ids: number[]): Map<number, number[]> {
    const g = new Map<number, number[]>();
    for (const id of ids) {
      const root = this.find(id).root;
      if (!g.has(root)) g.set(root, []);
      g.get(root)!.push(id);
    }
    return g;
  }
}

const applyRule2Bindings = (
  dsu: WeightedDSU,
  bindings: Rule2Binding[],
): void => {
  for (const { parent, child } of bindings) {
    // parent.level = child.level - 1
    // => parent - child = -1
    dsu.unionWithDelta(parent, child, -1);
  }
};

const getExternalChildrenOfSingleOtherBlock = (
  graph: PartGraph,
  dsu: WeightedDSU,
  a: number,
): { targetRoot: number; childIds: number[] } | null => {
  const aRoot = dsu.find(a).root;
  const byRoot = new Map<number, number[]>();

  for (const child of graph.outAdj.get(a) ?? []) {
    const childRoot = dsu.find(child).root;
    if (childRoot === aRoot) continue;
    if (!byRoot.has(childRoot)) byRoot.set(childRoot, []);
    byRoot.get(childRoot)!.push(child);
  }

  if (byRoot.size !== 1) return null;

  const [targetRoot, childIds] = [...byRoot.entries()][0];
  if (childIds.length === 0) return null;

  return { targetRoot, childIds };
};

const getMinChildByRelativeLevel = (
  dsu: WeightedDSU,
  childIds: number[],
): number => {
  let best = childIds[0];
  let bestDiff = dsu.find(best).diff;

  for (let i = 1; i < childIds.length; i++) {
    const id = childIds[i];
    const diff = dsu.find(id).diff;
    if (diff < bestDiff || (diff === bestDiff && id < best)) {
      best = id;
      bestDiff = diff;
    }
  }

  return best;
};

const tryMergeByExtendedRule = (
  graph: PartGraph,
  dsu: WeightedDSU,
  a: number,
): boolean => {
  const external = getExternalChildrenOfSingleOtherBlock(graph, dsu, a);
  if (!external) return false;

  const minChild = getMinChildByRelativeLevel(dsu, external.childIds);

  // A.level = minChild.level - 1
  // => A - minChild = -1
  return dsu.unionWithDelta(a, minChild, -1);
};

const saturateExtendedMerges = (graph: PartGraph, dsu: WeightedDSU): void => {
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of graph.ids) {
      if (tryMergeByExtendedRule(graph, dsu, a)) {
        changed = true;
      }
    }
  }
};

const materializeLevelsFromDSU = (
  graph: PartGraph,
  dsu: WeightedDSU,
): Map<number, number> => {
  // If multiple groups remain, this picks each root's base as 0,
  // then applies Rule 1 normalization over the whole prt.
  // Under the intended theory, a prt should saturate into one block.
  const raw = new Map<number, number>();

  let minLv = Infinity;
  for (const id of graph.ids) {
    const { diff } = dsu.find(id);
    raw.set(id, diff);
    minLv = Math.min(minLv, diff);
  }

  if (!Number.isFinite(minLv)) minLv = 0;

  for (const id of graph.ids) {
    raw.set(id, (raw.get(id) ?? 0) - minLv);
  }

  return raw;
};

const computeLevelsForPartition = (
  idx2chain: ChainMap,
  ids: number[],
): Map<number, number> => {
  if (ids.length === 0) return new Map();

  const graph = buildPartGraph(idx2chain, ids);
  const dsu = new WeightedDSU(ids);

  const bindings = collectRule2Bindings(graph);
  applyRule2Bindings(dsu, bindings);

  saturateExtendedMerges(graph, dsu);

  return materializeLevelsFromDSU(graph, dsu);
};

export { computeLevelsForPartition };
