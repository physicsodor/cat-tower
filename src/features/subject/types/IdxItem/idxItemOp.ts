const getNewIdx = (idx2Item: ReadonlyMap<number, unknown>): number => {
  let idx = 0;
  while (idx2Item.has(idx)) idx++;
  return idx;
};

export { getNewIdx };
