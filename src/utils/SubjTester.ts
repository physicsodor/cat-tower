import type { Subject } from "../types/SubjType";

export const test_idx_duplicate = (pInfos: Subject[]) => {
  return pInfos.filter((pInfo, index) => {
    return index === pInfos.findIndex((qInfo) => qInfo.idx === pInfo.idx);
  });
};

export const test_mom_empty = (pInfos: Subject[]) => {
  const pIdxs = new Set(pInfos.map((pInfo) => pInfo.idx));
  return pInfos.map((pInfo) => {
    if (pInfo.mom >= 0 && pIdxs.has(pInfo.mom)) return pInfo;
    return { ...pInfo, mom: -1 };
  });
};
