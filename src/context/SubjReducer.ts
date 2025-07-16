import type { SubjAct, Subject, SubjState } from "../types/SubjType";

const SubjDef = (i: number, m = -1, b = -1): Subject => ({
  idx: i,
  mom: m,
  bro: b,
});

export const SubjIni: SubjState = {
  infos: [],
  sels: new Set(),
};

export function subjReducer(state: SubjState, action: SubjAct): SubjState {
  const pInfos = state.infos;
  const pSels = state.sels;

  switch (action.type) {
    case "CLR_SELS":
      return {
        ...state,
        sels: new Set(action.idxs),
      };
    case "ADD_SUBJ":
      let i = 0;
      while (pInfos[i].idx === i) i++;
      const pBroInfos = pInfos.filter((info) => info.mom === -1);
      let b = -1;
      let pBro: Subject | undefined = pBroInfos[0];
      while (pBro) {
        b = pBro.idx;
        pBro = pBroInfos.find((info) => info.bro === b);
      }

      return {
        ...state,
        infos: [...pInfos, SubjDef(i, -1, b)].sort((a, b) => a.idx - b.idx),
        sels: new Set([i]),
      };
    case "DEL_SUBJ":
      return {
        ...state,
        infos: pInfos.filter((info) => !pSels.has(info.idx)),
        sels: new Set(),
      };
    default:
      return state;
  }
}
