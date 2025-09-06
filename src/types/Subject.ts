import { type Family } from "./Family";

export interface Subject extends Family {
  ttl: string;
  cnt: string;
  dsc: string;
}

export interface Course extends Family {
  ttl: string;
}

export const newSubject = (x: Family): Subject => ({
  ...x,
  ttl: `Subject ${x.idx}`,
  cnt: "",
  dsc: "",
});

export const newCourse = (x: Family): Course => ({
  ...x,
  ttl: `Course ${x.idx}`,
});

export const defaultCourse: Course = {
  idx: -1,
  ttl: "",
  bro: "",
  mom: -1,
  isMom: true,
};
