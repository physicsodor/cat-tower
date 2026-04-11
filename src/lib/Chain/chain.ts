import type { IdxItem } from "@/lib/IdxItem/idxItem";

export interface Chain extends IdxItem {
  pre: Set<number>;
}

type ChainInfo = {
  pre?: Set<number>;
  nxt?: Set<number>;
  preSet?: Set<number>;
  nxtSet?: Set<number>;
};
export type ChainMap = Map<number, ChainInfo>;
