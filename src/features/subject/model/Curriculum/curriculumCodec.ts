import type { Course, Curriculum, Subject } from "./curriculum";
import { zipText, unzipText } from "@/utils/textZip";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

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

// ─── Compact encoding for share URLs ─────────────────────────────────────────

const COMPACT_MARK = "~c~";

type CCompact = { t: "C"; i: number; m: number; b: string; T: string; s?: string };
type SCompact = { t: "S"; i: number; m: number; b: string; T: string; s?: string; c: string; x: number; y: number; p: number[] };
type Compact = CCompact | SCompact;

const toCompact = (x: Curriculum): Compact => {
  if (x.sbjType === "COURSE") {
    const r: CCompact = { t: "C", i: x.idx, m: x.mom, b: x.bro, T: x.title };
    if (x.short !== undefined) r.s = x.short;
    return r;
  }
  const r: SCompact = { t: "S", i: x.idx, m: x.mom, b: x.bro, T: x.title, c: x.content, x: x.x, y: x.y, p: [...x.pre] };
  if (x.short !== undefined) r.s = x.short;
  return r;
};

const fromCompact = (x: unknown): Curriculum | null => {
  if (typeof x !== "object" || x === null) return null;
  const r = x as Record<string, unknown>;
  const i = r["i"], m = r["m"], b = r["b"], T = r["T"];
  if (typeof i !== "number" || typeof m !== "number" || typeof b !== "string" || typeof T !== "string") return null;
  const s = typeof r["s"] === "string" ? r["s"] : undefined;
  if (r["t"] === "C") {
    const cur: Course = { sbjType: "COURSE", idx: i, mom: m, bro: b, title: T };
    if (s !== undefined) cur.short = s;
    return cur;
  }
  if (r["t"] === "S") {
    const c = r["c"], xx = r["x"], yy = r["y"], p = r["p"];
    if (typeof c !== "string" || typeof xx !== "number" || typeof yy !== "number") return null;
    if (!Array.isArray(p) || !p.every((v) => typeof v === "number")) return null;
    const cur: Subject = { sbjType: "SUBJECT", idx: i, mom: m, bro: b, title: T, content: c, x: xx, y: yy, pre: new Set(p) };
    if (s !== undefined) cur.short = s;
    return cur;
  }
  return null;
};

export const encodeListCompact = (list: ReadonlyArray<Curriculum>): string =>
  COMPACT_MARK + compressToEncodedURIComponent(JSON.stringify(list.map(toCompact)));

export const decodeListCompact = (s: string): Curriculum[] => {
  if (s.startsWith(COMPACT_MARK)) {
    try {
      const raw = JSON.parse(decompressFromEncodedURIComponent(s.slice(COMPACT_MARK.length)) ?? "[]");
      if (!Array.isArray(raw)) return [];
      const out: Curriculum[] = [];
      for (const item of raw) {
        const cur = fromCompact(item);
        if (cur) out.push(cur);
      }
      return out;
    } catch {
      return [];
    }
  }
  return decodeList(s);
};
