import { type IdxItem } from "./IdxItem";

/**
 * mom 규칙:
 * 1) ?�x, (x.mom = -1) or (?�y: x.mom = y),
 * 2) ?�x, ?�n?�ℕ,  if ?�x(.mom)??then x(.mom)????x.
 *
 * bro 규칙:
 * 1) ?�x, ?�y, if x.mom = y.mom then x.bro ??y.bro.
 */
export interface Family extends IdxItem {
  mom: number;
  bro: string;
}

