import { useLayoutEffect, useState } from "react";
import type { Camera } from "@/components/InfiniteCanvas";
import type { SbjMap } from "../model/Curriculum/curriculum";
import type { FamilyMap } from "@/lib/Family/family";
import { bboxFromLRTB, type BBox } from "../model/rect";

export const useBBoxMap = (
  itemsRef: React.RefObject<Map<number, HTMLDivElement | null>>,
  bboxMapRef: React.RefObject<Map<number, BBox>>,
  idx2sbj: SbjMap,
  idx2family: FamilyMap,
  dxy: { dx: number; dy: number },
  camera: Camera,
): Map<number, BBox> => {
  const [bboxMap, setBBoxMap] = useState(new Map<number, BBox>());

  useLayoutEffect(() => {
    const map = new Map<number, BBox>();

    const getBBox = (idx: number): BBox | null => {
      if (map.has(idx)) return map.get(idx)!;
      const f = idx2family.get(idx);
      const kids = f?.kids;
      if (!kids) {
        const item = itemsRef.current.get(idx);
        if (!item) return null;
        const r = item.getBoundingClientRect();
        const bbox = bboxFromLRTB(r.left, r.right, r.top, r.bottom);
        map.set(idx, bbox);
        return bbox;
      }
      let merged: BBox | null = null;
      for (const k of kids) {
        const kidBBox = getBBox(k);
        if (!kidBBox) continue;
        if (merged === null) {
          merged = kidBBox;
        } else {
          merged = bboxFromLRTB(
            Math.min(merged.l, kidBBox.l),
            Math.max(merged.r, kidBBox.r),
            Math.min(merged.t, kidBBox.t),
            Math.max(merged.b, kidBBox.b),
          );
        }
      }
      if (merged !== null) map.set(idx, merged);
      return merged;
    };

    for (const [idx] of idx2family) {
      if (idx < 0) continue;
      getBBox(idx);
    }

    setBBoxMap(map);
    bboxMapRef.current = map;
  }, [idx2sbj, idx2family, dxy, camera, bboxMapRef, itemsRef]);

  return bboxMap;
};
