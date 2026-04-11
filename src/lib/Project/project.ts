import type { Curriculum } from "@/lib/Curriculum/curriculum";
import type { TagType } from "@/lib/TagItem/tagItem";
import type { SpeciesType } from "@/lib/Species/species";

export type ProjectRecord = {
  id: string;
  user_id: string;
  title: string;
  data: string;
  updated_at: string;
};

export type ProjectData = {
  currList: ReadonlyArray<Curriculum>;
  tagList: ReadonlyArray<TagType>;
  spcList: ReadonlyArray<SpeciesType>;
};
