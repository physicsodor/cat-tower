import type { Chain } from "../Chain/Chain";
import { type Family } from "../Family/Family";

export type Curriculum = Subject | Course;

export interface Subject extends Family, Chain {
  title: string;
  short?: string;
  content: string;
  x: number;
  y: number;
  sbjType: "SUBJECT";
}

export interface Course extends Family {
  title: string;
  short?: string;
  sbjType: "COURSE";
}
