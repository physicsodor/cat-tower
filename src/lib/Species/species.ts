import type { Family } from "../Family/family";
import type { IdxItem } from "../IdxItem/idxItem";

export const DEFAULT_SPC_IDX = 0;

export type SpcNum = "NONE" | "INDEP" | "DEP";

export interface SpeciesType extends IdxItem {
  title: string;
  prefix: string;
  number: SpcNum;
  colorCode: number; // 0-8
}

export type SpeciesMap = ReadonlyMap<number, SpeciesType>;

export interface Species extends Family {
  spc: number;
}
