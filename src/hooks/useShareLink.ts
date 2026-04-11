import { useCallback, useState } from "react";
import type { RefObject } from "react";
import { supabase } from "@/lib/supabase";
import { encodeData } from "@/lib/Curriculum/curriculumCodec";
import { normalizeCenter } from "@/lib/Curriculum/curriculumOp";
import { pruneTagTypes } from "@/lib/TagItem/tagItemOp";
import type { Curriculum } from "@/lib/Curriculum/curriculum";
import type { TagType } from "@/lib/TagItem/TagItem";

const SHARE_ID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function genShareId(): string {
  const arr = new Uint32Array(7);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => SHARE_ID_CHARS[v % SHARE_ID_CHARS.length]).join("");
}

export const useShareLink = (
  listRef: RefObject<ReadonlyArray<Curriculum>>,
  tagTypesRef: RefObject<ReadonlyArray<TagType>>,
) => {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const openShare = useCallback(async () => {
    setShareLoading(true);
    try {
      const list = normalizeCenter(listRef.current ?? []);
      const tagTypes = pruneTagTypes(list, tagTypesRef.current ?? []);
      const encoded = encodeData(list, tagTypes);
      const id = genShareId();
      await supabase.from("share_links").insert({ id, data: encoded });
      const url = new URL(window.location.href);
      url.searchParams.set("s", id);
      setShareUrl(url.toString());
    } finally {
      setShareLoading(false);
    }
  }, [listRef, tagTypesRef]);

  const closeShare = useCallback(() => setShareUrl(null), []);

  return { shareUrl, shareLoading, openShare, closeShare };
};
