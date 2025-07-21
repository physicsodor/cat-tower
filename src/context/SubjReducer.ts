import type { SubjAct, Subject, SubjState } from "../types/SubjType";

const SubjDef = (i: number, m = -1, b = -1): Subject => ({
  idx: i,
  mom: m,
  bro: b,
});

export const SubjIni: SubjState = {
  infos: [],
  // infos: testForMom([
  //   { idx: 0, mom: -1, bro: -1 },
  //   { idx: 1, mom: 7, bro: -1 },
  //   { idx: 3, mom: 4, bro: -1 },
  //   { idx: 7, mom: 4, bro: -1 },
  //   { idx: 8, mom: 4, bro: -1 },
  //   { idx: 9, mom: 4, bro: -1 },
  // ]), // for test
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
      while (pInfos[i] && pInfos[i].idx === i) i++;
      const pBroInfos = pInfos.filter((info) => info.mom === -1);
      let b = -1;
      let pBro: Subject | undefined = pBroInfos[0];
      while (pBro) {
        b = pBro.idx;
        pBro = pBroInfos.find((info) => info.bro === b);
      }

      return {
        ...state,
        infos: [...pInfos, SubjDef(i, -1, -1)].sort((a, b) => a.idx - b.idx),
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
