import type { Chain } from "@/lib/Chain/chain";
import type { Family } from "@/lib/Family/family";
import type { TagItem } from "@/lib/TagItem/TagItem";

export type Curriculum = Subject | Course;

export interface Subject extends Family, Chain, TagItem {
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

type SbjInfo =
  | { sbjType: "COURSE"; title: string; short?: string }
  | {
      sbjType: "SUBJECT";
      title: string;
      short?: string;
      content: string;
      x: number;
      y: number;
    };
export type SbjMap = ReadonlyMap<number, SbjInfo>;
export type { SbjInfo };
