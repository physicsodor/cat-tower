const modifyItems = <T>(
  TList: ReadonlyArray<T>,
  idx2new: ReadonlyMap<number, Partial<T> | null>
): T[] => {
  const targetSet = new Set(idx2new.keys());
  const visited = new Set<number>();
  const result: T[] = [];
  for (const t of TList) {
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
