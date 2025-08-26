import { DefFam, type Family } from "./Family";
import type { Subject } from "./Subject";

export interface Course extends Family {
  Course: null;
  ttl: string;
}

export const DefCrs = (i = 0, b = -1): Course => ({
  ...DefFam(i, b),
  Course: null,
  ttl: `Course ${i}`,
});

export const isCourse = (x: Course | Subject) => "Course" in x;
