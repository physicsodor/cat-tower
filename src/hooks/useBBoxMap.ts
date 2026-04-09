import { useLayoutEffect, useState } from "react";
import type { Camera } from "infinite-canvas";
import type { SbjMap } from "@/lib/Curriculum/curriculum";
import type { FamilyMap } from "@/lib/Family/family";
import { bboxFromLRTB, type BBox } from "@/lib/rect";

export const useBBoxMap = (
  itemsRef: React.RefObject<Map<number, HTMLDivElement | null>>,
  bboxMapRef: React.RefObject<Map<number, BBox>>,
  idx2sbj: SbjMap,
  idx2family: FamilyMap,
  dxy: { dx: number; dy: number },
  camera: Camera,
  horizontal: boolean,
): Map<number, BBox> => {
  const [bboxMap, setBBoxMap] = useState(new Map<number, BBox>());

  useLayoutEffect(() => {
    const map = new Map<number, BBox>();
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gXL = rootFontSize; // --G-XL = 1rem

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
        const kf = idx2family.get(k);
        let kidBBox: BBox | null = getBBox(k);
        if (!kidBBox) continue;
        // 자식이 Crs이면 실제 시각적 크기(padding 포함)로 확장
        if (kf?.kids) {
          kidBBox = bboxFromLRTB(
            kidBBox.l - gXL,
            kidBBox.r + gXL,
            kidBBox.t - gXL,
            kidBBox.b + gXL,
          );
        }
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
  }, [idx2sbj, idx2family, dxy, camera, bboxMapRef, itemsRef, horizontal]);

  return bboxMap;
};
