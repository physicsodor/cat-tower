import { DefSbj, type Subject } from "../types/Subject";

export const ordByIdx = (sbjList: Subject[], idx: number) => {
  for (let i = 0; i < sbjList.length; i++) {
    if (sbjList[i].idx === idx) return i;
  }
  return -1;
};

export const sbjByIdx = (sbjList: Subject[], idx: number) => {
  for (let s of sbjList) {
    if (s.idx === idx) return s;
  }
  return DefSbj();
};
