import { type IdxItem } from "./IdxItem";

export interface Family extends IdxItem {
  mom: number;
  bro: number;
  readonly isMom: boolean;
}
