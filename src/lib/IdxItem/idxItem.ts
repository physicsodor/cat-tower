/**
 ** idx: 고유번호
 */
export interface IdxItem {
  readonly idx: number;
}

const getNewIdx = (idx2Item: ReadonlyMap<number, unknown>): number => {
  let idx = 0;
  while (idx2Item.has(idx)) idx++;
  return idx;
};

export { getNewIdx };
