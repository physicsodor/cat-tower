import type { Subject } from "../types/SubjType";

export const testForIdx = (pInfos: Subject[]) => {
  return pInfos.filter((pInfo, index) => {
    return index === pInfos.findIndex((qInfo) => qInfo.idx === pInfo.idx);
  });
};

export const test_mom_empty = (pInfos: Subject[]) => {
  const pIdxs = new Set(pInfos.map((info) => info.idx));
  return pInfos.map((info) => {
    const [i, m] = [info.idx, info.mom];
    if (m >= 0 && m !== i && pIdxs.has(m)) return info;
    return { ...info, mom: -1 };
  });
};

export const testForMom = (pInfos: Subject[]) => {
  let pIdxs = new Set(pInfos.map((info) => info.idx));
  let temp: Set<number>;
  let idx: number;
  let mom: number;
  while (pIdxs.size > 0) {}
};
