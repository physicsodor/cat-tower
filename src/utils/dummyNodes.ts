import type { ChainMap } from "@/lib/Chain/chain";

const DUMMY_ID_START = 500_000_000;

const insertDummyNodes = (
  idx2chain: ChainMap,
  idx2level: Map<number, number>,
  realNodeIdSet: Set<number>,
): {
  localChain: ChainMap;
  dummyIds: Set<number>;
  dummyLevel: Map<number, number>;
  dummyToReal: Map<number, number>;
} => {
  const localChain: ChainMap = new Map();
  for (const [id, info] of idx2chain) {
    if (!realNodeIdSet.has(id)) continue;
    localChain.set(id, {
      pre: new Set(info.pre ?? []),
      nxt: new Set(info.nxt ?? []),
    });
  }

  const dummyIds = new Set<number>();
  const dummyLevel = new Map<number, number>();
  const dummyToReal = new Map<number, number>();
  let nextDummyId = DUMMY_ID_START;

  const allocDummyId = (): number => {
    while (realNodeIdSet.has(nextDummyId) || dummyIds.has(nextDummyId))
      nextDummyId++;
    return nextDummyId++;
  };

  for (const fromId of realNodeIdSet) {
    const lvA = idx2level.get(fromId) ?? 0;
    for (const toId of idx2chain.get(fromId)?.nxt ?? []) {
      if (!realNodeIdSet.has(toId)) continue;
      const lvB = idx2level.get(toId) ?? 0;
      if (lvB - lvA < 2) continue;

      localChain.get(fromId)!.nxt!.delete(toId);
      localChain.get(toId)!.pre!.delete(fromId);

      const chain: number[] = [fromId];
      for (let lv = lvA + 1; lv < lvB; lv++) {
        const dId = allocDummyId();
        dummyIds.add(dId);
        dummyLevel.set(dId, lv);
        dummyToReal.set(dId, fromId);
        localChain.set(dId, { pre: new Set(), nxt: new Set() });
        chain.push(dId);
      }
      chain.push(toId);

      for (let i = 0; i < chain.length - 1; i++) {
        localChain.get(chain[i])!.nxt!.add(chain[i + 1]);
        localChain.get(chain[i + 1])!.pre!.add(chain[i]);
      }
    }
  }

  return { localChain, dummyIds, dummyLevel, dummyToReal };
};

export { DUMMY_ID_START, insertDummyNodes };
