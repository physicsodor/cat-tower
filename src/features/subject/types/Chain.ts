import type { IdxItem } from "./IdxItem";

export interface Chain extends IdxItem {
  pre: Set<number>;
}

export const isChain = <T extends Chain>(x: unknown): x is T =>
  !!x && typeof x === "object" && "pre" in (x as object);
