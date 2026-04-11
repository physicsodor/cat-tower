import type { Course, Curriculum, Subject } from "./curriculum";
import type { TagType } from "@/lib/TagItem/TagItem";
import { zipText, unzipText } from "@/utils/textZip";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

// Serialised form: Subject's Set fields become number[]
type XCourse = Course;
type XSubject = Omit<Subject, "pre" | "tag"> & { pre: number[]; tag: number[] };
export type XCurriculum = XCourse | XSubject;

type PayloadV1 = { v: 1; list: XCurriculum[]; tagTypes: TagType[] };

export type DecodedData = { list: Curriculum[]; tagTypes: TagType[] };

// ─── Encode/decode helpers ────────────────────────────────────────────────────

const encodeSbj = (x: Curriculum): XCurriculum =>
  x.sbjType === "COURSE"
    ? x
    : { ...x, pre: [...x.pre], tag: [...x.tag] };

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const safeDecodeSbj = (x: unknown): Curriculum[] => {
  if (!isRecord(x)) return [];
  if (x["sbjType"] === "COURSE") {
    const { idx, mom, bro, title } = x as Record<string, unknown>;
    if (
      typeof idx !== "number" ||
      typeof mom !== "number" ||
      typeof bro !== "string" ||
      typeof title !== "string"
    )
      return [];
    const cur: Course = { idx, mom, bro, title, sbjType: "COURSE" };
    if (typeof x["short"] === "string") cur.short = x["short"];
    return [cur];
  }
  if (x["sbjType"] === "SUBJECT") {
    const { idx, mom, bro, title, content, x: cx, y: cy, pre } = x as Record<string, unknown>;
    if (
      typeof idx !== "number" ||
      typeof mom !== "number" ||
      typeof bro !== "string" ||
      typeof title !== "string" ||
      typeof content !== "string" ||
      typeof cx !== "number" ||
      typeof cy !== "number"
    )
      return [];
    if (!Array.isArray(pre) || !pre.every((v) => typeof v === "number")) return [];
    const tag = new Set<number>(
      Array.isArray(x["tag"])
        ? (x["tag"] as unknown[]).filter((v): v is number => typeof v === "number")
        : [],
    );
    const cur: Subject = {
      idx,
      mom,
      bro,
      title,
      content,
      x: cx,
      y: cy,
      sbjType: "SUBJECT",
      pre: new Set(pre as number[]),
      tag,
    };
    if (typeof x["short"] === "string") cur.short = x["short"];
    return [cur];
  }
  return [];
};

// ─── Main encode/decode ───────────────────────────────────────────────────────

export const encodeData = (
  list: ReadonlyArray<Curriculum>,
  tagTypes: ReadonlyArray<TagType>,
): string => {
  const payload: PayloadV1 = { v: 1, list: list.map(encodeSbj), tagTypes: [...tagTypes] };
  return zipText(JSON.stringify(payload));
};

export const decodeData = (s: string): DecodedData => {
  if (s.startsWith(COMPACT_MARK)) {
    return { list: decodeListCompact(s), tagTypes: [] };
  }
  try {
    const raw: unknown = JSON.parse(unzipText(s));
    if (isRecord(raw) && "v" in raw) {
      if (raw["v"] === 1) {
        const items = Array.isArray(raw["list"]) ? raw["list"] : [];
        const tags = Array.isArray(raw["tagTypes"]) ? (raw["tagTypes"] as TagType[]) : [];
        return { list: (items as unknown[]).flatMap(safeDecodeSbj), tagTypes: tags };
      }
      return { list: [], tagTypes: [] };
    }
    // v0: no version field — array of Curriculum
    const items = Array.isArray(raw) ? raw : [];
    return { list: (items as unknown[]).flatMap(safeDecodeSbj), tagTypes: [] };
  } catch {
    return { list: [], tagTypes: [] };
  }
};

// ─── Compact encoding for share URLs ─────────────────────────────────────────
// tag is intentionally excluded — share recipients lack the TagType list

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
    const cur: Subject = { sbjType: "SUBJECT", idx: i, mom: m, bro: b, title: T, content: c, x: xx, y: yy, pre: new Set(p), tag: new Set() };
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
  return decodeData(s).list;
};
