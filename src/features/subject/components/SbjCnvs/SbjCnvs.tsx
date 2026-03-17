import { useCallback, useEffect, useRef } from "react";
import SbjCnvsCurveContainer from "./SbjCnvsCurveContainer";
import SbjCnvsCrsContainer from "./SbjCnvsCrsContainer";
import SbjCnvsItemContainer from "./SbjCnvsItemContainer";
import { useSbjData } from "../../store/SbjDataContext";
import { useSbjSelect } from "../../store/SbjSelectContext";
import InfiniteCanvas, {
  useInfiniteCanvas,
  type Camera,
} from "@/components/InfiniteCanvas";
import { useBBoxMap } from "../../hooks/useBBoxMap";
import { bboxFromXYWH, type BBox } from "../../model/rect";
import BttnAutoLayout from "@/components/Bttn/BttnAutoLayout";

// ── Inner content (reads camera/dxy from InfiniteCanvasContext) ───────────────

type InnerProps = {
  itemsRef: React.RefObject<Map<number, HTMLDivElement | null>>;
  bboxMapRef: React.RefObject<Map<number, BBox>>;
};

const SbjCnvsInner = ({ itemsRef, bboxMapRef }: InnerProps) => {
  const { camera, dxy } = useInfiniteCanvas();
  const { idx2sbj, idx2family, syncCamera } = useSbjData();

  useEffect(() => {
    syncCamera(camera);
  }, [camera, syncCamera]);

  const bboxMap = useBBoxMap(
    itemsRef,
    bboxMapRef,
    idx2sbj,
    idx2family,
    dxy,
    camera,
  );

  return (
    <>
      <SbjCnvsCrsContainer bboxMap={bboxMap} items={itemsRef.current} back />
      <SbjCnvsCurveContainer bboxMap={bboxMap} zoom={camera.zoom} />
      <SbjCnvsCrsContainer bboxMap={bboxMap} items={itemsRef.current} />
      <SbjCnvsItemContainer items={itemsRef.current} />
    </>
  );
};

// ── Outer wrapper ─────────────────────────────────────────────────────────────

const SbjCnvs = () => {
  const { cnvsDrag, idx2sbj, setCnvsPos, autoLayout, getCamera } = useSbjData();
  const { selectMany, selectedSet } = useSbjSelect();
  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const bboxMapRef = useRef(new Map<number, BBox>());

  const onAutoLayout = useCallback(() => {
    const { x: cx, y: cy, zoom } = getCamera();
    const worldBBoxes = new Map<number, BBox>();
    for (const [idx, bbox] of bboxMapRef.current) {
      worldBBoxes.set(
        idx,
        bboxFromXYWH(
          (bbox.x - cx) / zoom,
          (bbox.y - cy) / zoom,
          bbox.w / zoom,
          bbox.h / zoom,
        ),
      );
    }
    autoLayout(worldBBoxes);
  }, [autoLayout, getCamera, bboxMapRef]);

  const onItemDragEnd = useCallback(
    (worldDx: number, worldDy: number) => {
      const drag = cnvsDrag.get();
      if (drag.size > 0) {
        setCnvsPos(drag, { dx: Math.round(worldDx), dy: Math.round(worldDy) });
        cnvsDrag.set(new Set());
      }
    },
    [cnvsDrag, setCnvsPos],
  );

  const onMarqueeSelect = useCallback(
    (
      selL: number,
      selR: number,
      selT: number,
      selB: number,
      mode: "window" | "cross",
      ctrlKey: boolean,
      shiftKey: boolean,
    ) => {
      const hit = new Set<number>();
      for (const [idx, bbox] of bboxMapRef.current) {
        if (idx < 0) continue;
        const s = idx2sbj.get(idx);
        if (!s || s.sbjType !== "SUBJECT") continue;
        if (mode === "window") {
          if (
            bbox.l >= selL &&
            bbox.r <= selR &&
            bbox.t >= selT &&
            bbox.b <= selB
          )
            hit.add(idx);
        } else {
          if (bbox.l < selR && bbox.r > selL && bbox.t < selB && bbox.b > selT)
            hit.add(idx);
        }
      }
      if (ctrlKey) {
        selectMany(new Set([...selectedSet, ...hit]));
      } else if (shiftKey) {
        const next = new Set(selectedSet);
        for (const idx of hit) next.delete(idx);
        selectMany(next);
      } else {
        selectMany(hit);
      }
    },
    [idx2sbj, selectMany, selectedSet],
  );

  const onFitRequest = useCallback((): Camera | null => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const [, s] of idx2sbj) {
      if (s.sbjType !== "SUBJECT") continue;
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x);
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y);
    }
    if (!isFinite(minX))
      return { x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 };
    return {
      zoom: 1,
      x: window.innerWidth / 2 - (minX + maxX) / 2,
      y: window.innerHeight / 2 - (minY + maxY) / 2,
    };
  }, [idx2sbj]);

  return (
    <InfiniteCanvas
      className="sbj-cnvs"
      marqueeSuppressSelector=".sbj-cnvs-item"
      onItemDragEnd={onItemDragEnd}
      onMarqueeSelect={onMarqueeSelect}
      onFitRequest={onFitRequest}
      controls={<BttnAutoLayout onDown={onAutoLayout} className="-big" />}
    >
      <SbjCnvsInner itemsRef={itemsRef} bboxMapRef={bboxMapRef} />
    </InfiniteCanvas>
  );
};

export default SbjCnvs;
