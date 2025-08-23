import { DefFam, type Family } from "./Family";

export interface Course extends Family {
  ttl: string;
}

export const DefCrs = (i = 0, m = -1): Course => ({
  ...DefFam(i, m),
  ttl: `Course ${i}`,
});
