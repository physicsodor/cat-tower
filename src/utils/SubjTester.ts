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
  let restIdxs = new Set(pInfos.map((info) => info.idx));
  let safeIdxs = new Set([-1]);
  let fmlyIdxs: Set<number> = new Set([]);
  let i: number = restIdxs.values().next().value ?? -1;
  let m: number;

  while (restIdxs.size > 0) {
    if (i < 0) break; // restIdxs is empty.
    restIdxs.delete(i);
    fmlyIdxs.add(i);
    m = pInfos.find((info) => info.idx === i)?.mom ?? -1;
    if (i === m || !restIdxs.has(m)) {
      pInfos = pInfos.map((info) =>
        info.idx === i ? { ...info, mom: -1 } : info
      );
      m = -1;
    } // No mom.
    if (safeIdxs.has(m)) {
      for (const x of fmlyIdxs) {
        safeIdxs.add(x);
      }
      i = restIdxs.values().next().value ?? -1;
    } // Reach the -1.
    else {
      i = pInfos.find((info) => info.idx === m)?.idx ?? -1;
    }
  }
  return pInfos;
};
