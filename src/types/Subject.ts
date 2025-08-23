import { DefFam, type Family } from "./Family";

export interface Subject extends Family {
  ttl: string;
  cnt: string;
  dsc: string;
}

export const DefSbj = (i = 0, m = -1): Subject => ({
  ...DefFam(i, m),
  ttl: `Subject ${i}`,
  cnt: "",
  dsc: "",
});
