export type Subject = {
  idx: number;
  mom: number;
  bro: number;
};

export type SubjState = {
  infos: Subject[];
  sels: Set<number>;
};

export type SubjAct =
  | { type: "CLR_SELS"; idxs: number[] }
  | { type: "ADD_SUBJ" }
  | { type: "DEL_SUBJ" };
