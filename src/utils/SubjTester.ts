import type { Subject } from "../types/SubjType";

export const test_SubjState_idx = (pInfos: Subject[]) => {
  return pInfos.filter((pInfo, index) => {
    return index === pInfos.findIndex((qInfo) => qInfo.idx === pInfo.idx);
  });
};
