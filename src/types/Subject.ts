import { DefFam, type Family } from "./Family";

export interface Subject extends Family {
  ttl: string;
  cnt: string;
  dsc: string;
}

export const DefSbj = (i = 0, b = -1): Subject => ({
  ...DefFam(i, b),
  ttl: `Subject ${i}`,
  cnt: "",
  dsc: "",
});
