import type { Chain } from "./Chain";
import { type Family } from "./Family";

export type Curriculum = Subject | Course;

export interface Subject extends Family, Chain {
  ttl: string;
  cnt: string;
  dsc: string;
  x: number;
  y: number;
  sbjType: "SUBJECT";
}

export interface Course extends Family {
  ttl: string;
  sbjType: "COURSE";
}

