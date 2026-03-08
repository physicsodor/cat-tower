import type { Course, Curriculum, Subject } from "./Curriculum";
import { zipText, unzipText } from "@/utils/textZip";

type XCourse = Course;
type XSubject = Omit<Subject, "pre"> & { pre: number[] };
export type XCurriculum = XCourse | XSubject;

const encodeSbj = (x: Curriculum): XCurriculum =>
  x.sbjType === "COURSE" ? x : { ...x, pre: [...x.pre] };

const decodeSbj = (x: XCurriculum): Curriculum =>
  x.sbjType === "COURSE" ? x : { ...x, pre: new Set(x.pre) };

export const encodeList = (list: ReadonlyArray<Curriculum>): string =>
  zipText(JSON.stringify(list.map((x) => encodeSbj(x))));

export const decodeList = (s: string): Curriculum[] => {
  try {
    const isRecord = (x: unknown): x is Record<string, unknown> =>
      typeof x === "object" && x !== null;
    const isXCourse = (x: unknown): x is XCourse =>
      isRecord(x) && x["sbjType"] === "COURSE" && typeof x["title"] === "string";
    const isXSubject = (x: unknown): x is XSubject => {
      if (!isRecord(x) || x["sbjType"] !== "SUBJECT") return false;
      const pre = (x as Record<string, unknown>)["pre"];
      return Array.isArray(pre) && pre.every((v) => typeof v === "number");
    };

    const raw = JSON.parse(unzipText(s));
    if (!Array.isArray(raw)) return [];
    const out: Curriculum[] = [];
    for (const item of raw) {
      if (isXSubject(item)) out.push(decodeSbj(item));
      else if (isXCourse(item)) out.push(item);
    }
    return out;
  } catch {
    return [];
  }
};
