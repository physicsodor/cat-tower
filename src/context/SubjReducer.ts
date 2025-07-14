import type { SubjAct, Subject, SubjState } from "../types/SubjType";

export const SubjDef = (i: number): Subject => ({
  idx: i,
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
      const pIdxs = pInfos.map((info) => info.idx).sort((a, b) => a - b);
      let i = 0;
      while (pIdxs[i] === i) i++;
      return { ...state, infos: [...pInfos, SubjDef(i)], sels: new Set([i]) };
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
