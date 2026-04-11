import type { Course, Curriculum, Subject } from "@/lib/Curriculum/curriculum";
import type { TagType } from "@/lib/TagItem/tagItem";
import { DEFAULT_SPC_IDX, type SpeciesType } from "@/lib/Species/species";
import { zipText, unzipText } from "@/utils/textZip";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { ProjectData } from "./project";

// Serialised form: Subject's Set fields become number[]
type XCourse = Course;
type XSubject = Omit<Subject, "pre" | "tag"> & { pre: number[]; tag: number[] };
export type XCurriculum = XCourse | XSubject;

type PayloadV1 = { v: 1; list: XCurriculum[]; tagTypes: TagType[]; spcTypes?: SpeciesType[] };

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
    const spc = typeof x["spc"] === "number" ? x["spc"] : DEFAULT_SPC_IDX;
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
      spc,
    };
    if (typeof x["short"] === "string") cur.short = x["short"];
    return [cur];
  }
  return [];
};

const EMPTY: ProjectData = { currList: [], tagList: [], spcList: [] };

// ─── Main encode/decode ───────────────────────────────────────────────────────

export const encodeData = (data: ProjectData): string => {
  const payload: PayloadV1 = {
    v: 1,
    list: data.currList.map(encodeSbj),
    tagTypes: [...data.tagList],
    spcTypes: [...data.spcList],
  };
  return zipText(JSON.stringify(payload));
};

export const decodeData = (s: string): ProjectData => {
  if (s.startsWith(COMPACT_MARK)) {
    return decodeListCompact(s);
  }
  try {
    const raw: unknown = JSON.parse(unzipText(s));
    if (isRecord(raw) && "v" in raw) {
      if (raw["v"] === 1) {
        const items = Array.isArray(raw["list"]) ? raw["list"] : [];
        const tagList = Array.isArray(raw["tagTypes"]) ? (raw["tagTypes"] as TagType[]) : [];
        const spcList = Array.isArray(raw["spcTypes"]) ? (raw["spcTypes"] as SpeciesType[]) : [];
        return { currList: (items as unknown[]).flatMap(safeDecodeSbj), tagList, spcList };
      }
      return EMPTY;
    }
    // v0: no version field — array of Curriculum
    const items = Array.isArray(raw) ? raw : [];
    return { currList: (items as unknown[]).flatMap(safeDecodeSbj), tagList: [], spcList: [] };
  } catch {
    return EMPTY;
  }
};

// ─── Compact encoding for share URLs ─────────────────────────────────────────

const COMPACT_MARK = "~c~";

type CCompact = { t: "C"; i: number; m: number; b: string; T: string; s?: string };
type SCompact = { t: "S"; i: number; m: number; b: string; T: string; s?: string; c: string; x: number; y: number; p: number[]; g?: number[]; sp?: number };
type Compact = CCompact | SCompact;

const toCompact = (x: Curriculum): Compact => {
  if (x.sbjType === "COURSE") {
    const r: CCompact = { t: "C", i: x.idx, m: x.mom, b: x.bro, T: x.title };
    if (x.short !== undefined) r.s = x.short;
    return r;
  }
  const r: SCompact = { t: "S", i: x.idx, m: x.mom, b: x.bro, T: x.title, c: x.content, x: x.x, y: x.y, p: [...x.pre], g: [...x.tag], sp: x.spc };
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
    const tag = new Set<number>(
      Array.isArray(r["g"]) ? (r["g"] as unknown[]).filter((v): v is number => typeof v === "number") : [],
    );
    const spc = typeof r["sp"] === "number" ? r["sp"] : DEFAULT_SPC_IDX;
    const cur: Subject = { sbjType: "SUBJECT", idx: i, mom: m, bro: b, title: T, content: c, x: xx, y: yy, pre: new Set(p), tag, spc };
    if (s !== undefined) cur.short = s;
    return cur;
  }
  return null;
};

export const encodeListCompact = (data: ProjectData): string => {
  const payload = { items: data.currList.map(toCompact), tts: [...data.tagList], sts: [...data.spcList] };
  return COMPACT_MARK + compressToEncodedURIComponent(JSON.stringify(payload));
};

export const decodeListCompact = (s: string): ProjectData => {
  if (s.startsWith(COMPACT_MARK)) {
    try {
      const raw: unknown = JSON.parse(decompressFromEncodedURIComponent(s.slice(COMPACT_MARK.length)) ?? "null");
      let items: unknown[];
      let tagList: TagType[] = [];
      let spcList: SpeciesType[] = [];
      if (Array.isArray(raw)) {
        // 구버전: raw array (tag/species 없음)
        items = raw;
      } else if (isRecord(raw) && Array.isArray(raw["items"])) {
        items = raw["items"] as unknown[];
        if (Array.isArray(raw["tts"])) tagList = raw["tts"] as TagType[];
        if (Array.isArray(raw["sts"])) spcList = raw["sts"] as SpeciesType[];
      } else {
        return EMPTY;
      }
      const currList: Curriculum[] = [];
      for (const item of items) {
        const cur = fromCompact(item);
        if (cur) currList.push(cur);
      }
      return { currList, tagList, spcList };
    } catch {
      return EMPTY;
    }
  }
  return decodeData(s);
};
