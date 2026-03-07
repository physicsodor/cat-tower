import { type IdxItem } from "../IdxItem/IdxItem";

/**
 ** mom: 부모의 idx
 ** bro: 공통 부모를 갖는 형제와의 순서
 */
export interface Family extends IdxItem {
  mom: number;
  bro: string;
}

/**
 ** kids: 자식의 idx로 된 배열
 ** left: 인접한 형제 중 바로 앞의 bro
 ** right: 인접한 형제 중 바로 뒤의 bro
 ** first: 자식 중 가장 앞의 bro
 ** last: 자식 중 가장 뒤의 bro
 */
export type FamilyInfo = {
  mom?: number;
  bro?: string;
  kids?: number[];
  left?: string;
  right?: string;
  first?: string;
  last?: string;
};

/**
 ** idx -> FamilyInfo
 */
export type FamilyMap = ReadonlyMap<number, FamilyInfo>;

/**
 ** "LEFT": 형제관계에서 앞 방향
 ** "RIGHT": 형제관계에서 뒤 방향
 */
export type BroDir = "LEFT" | "RIGHT";
