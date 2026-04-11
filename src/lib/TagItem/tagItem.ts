import type { IdxItem } from "../IdxItem/idxItem";

export interface TagType extends IdxItem {
  title: string;
}

export interface TagItem extends IdxItem {
  tag: Set<number>;
}
