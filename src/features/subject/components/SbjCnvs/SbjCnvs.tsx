import { useCallback, useEffect, useRef, useState } from "react";
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
import { Toggle } from "@/components/Toggle/Toggle";
import { useSbjSyncCtx } from "../../store/SbjSyncContext";
import { HORIZONTAL_MODE_KEY } from "../../constants";

// ── Inner content (reads camera/dxy from InfiniteCanvasContext) ───────────────

type InnerProps = {
  itemsRef: React.RefObject<Map<number, HTMLDivElement | null>>;
  bboxMapRef: React.RefObject<Map<number, BBox>>;
  horizontal: boolean;
};

const SbjCnvsInner = ({ itemsRef, bboxMapRef, horizontal }: InnerProps) => {
  const { camera, dxy } = useInfiniteCanvas();
  const { idx2sbj, idx2family, syncCamera } = useSbjData();
  const { selectMany } = useSbjSelect();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pinnedSet, setPinnedSet] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    syncCamera(camera);
  }, [camera, syncCamera]);

  const onPinToggle = useCallback((idx: number) => {
    setPinnedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      setPinnedSet(new Set());
      selectMany(new Set());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectMany]);

  const bboxMap = useBBoxMap(
    itemsRef,
    bboxMapRef,
    idx2sbj,
    idx2family,
    dxy,
    camera,
    horizontal,
  );

  const activeHoveredIdx =
    hoveredIdx !== null && idx2sbj.has(hoveredIdx) ? hoveredIdx : null;
  const anyHovered = activeHoveredIdx !== null || pinnedSet.size > 0;

  return (
    <>
      <SbjCnvsCrsContainer
        bboxMap={bboxMap}
        items={itemsRef.current}
        back
        anyHovered={anyHovered}
      />
      <SbjCnvsCurveContainer
        bboxMap={bboxMap}
        zoom={camera.zoom}
        horizontal={horizontal}
      />
      <SbjCnvsCrsContainer
        bboxMap={bboxMap}
        items={itemsRef.current}
        anyHovered={anyHovered}
      />
      <SbjCnvsItemContainer
        items={itemsRef.current}
        horizontal={horizontal}
        activeHoveredIdx={activeHoveredIdx}
        pinnedSet={pinnedSet}
        onHoverChange={setHoveredIdx}
        onPinToggle={onPinToggle}
      />
    </>
  );
};

// ── Outer wrapper ─────────────────────────────────────────────────────────────

const SbjCnvs = () => {
  const {
    cnvsDrag,
    idx2sbj,
    idx2chain,
    setCnvsPos,
    autoLayout,
    getCamera,
    addCrs,
  } = useSbjData();
  const { selectMany, selectedSet } = useSbjSelect();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      if (e.key === "g" || e.key === "G") {
        if (selectedSet.size > 0) {
          e.preventDefault();
          addCrs();
        }
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        const all = new Set<number>();
        for (const [idx, sbj] of idx2sbj) {
          if (sbj.sbjType === "SUBJECT") all.add(idx);
        }
        selectMany(all);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedSet, addCrs, selectMany, idx2sbj]);
  const { currentProjectId } = useSbjSyncCtx();

  const loadHorizontal = (projectId: string | null): boolean =>
    localStorage.getItem(`${HORIZONTAL_MODE_KEY}_${projectId ?? "draft"}`) === "true";

  const [projectIdForHorizontal, setProjectIdForHorizontal] = useState(currentProjectId);
  const [horizontal, setHorizontalState] = useState(() => loadHorizontal(currentProjectId));

  if (projectIdForHorizontal !== currentProjectId) {
    setProjectIdForHorizontal(currentProjectId);
    setHorizontalState(loadHorizontal(currentProjectId));
  }

  const setHorizontal = useCallback(
    (value: boolean) => {
      localStorage.setItem(`${HORIZONTAL_MODE_KEY}_${currentProjectId ?? "draft"}`, String(value));
      setHorizontalState(value);
    },
    [currentProjectId],
  );

  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const bboxMapRef = useRef(new Map<number, BBox>());

  const onAutoLayout = useCallback(() => {
    const { x: cx, y: cy, zoom } = getCamera();
    const worldBBoxes = new Map<number, BBox>();
    for (const [idx, bbox] of bboxMapRef.current) {
      if (!idx2chain.has(idx)) continue;
      worldBBoxes.set(
        idx,
        horizontal
          ? bboxFromXYWH(
              (bbox.y - cy) / zoom,
              (bbox.x - cx) / zoom,
              bbox.h / zoom,
              bbox.w / zoom,
            )
          : bboxFromXYWH(
              (bbox.x - cx) / zoom,
              (bbox.y - cy) / zoom,
              bbox.w / zoom,
              bbox.h / zoom,
            ),
      );
    }
    autoLayout(worldBBoxes);
  }, [autoLayout, getCamera, bboxMapRef, idx2chain, horizontal]);

  const onItemDragEnd = useCallback(
    (worldDx: number, worldDy: number) => {
      const drag = cnvsDrag.get();
      if (drag.size > 0) {
        setCnvsPos(drag, {
          dx: Math.round(horizontal ? worldDy : worldDx),
          dy: Math.round(horizontal ? worldDx : worldDy),
        });
        cnvsDrag.set(new Set());
      }
    },
    [cnvsDrag, setCnvsPos, horizontal],
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
    let minSX = Infinity,
      maxSX = -Infinity,
      minSY = Infinity,
      maxSY = -Infinity;
    for (const [, s] of idx2sbj) {
      if (s.sbjType !== "SUBJECT") continue;
      const sx = horizontal ? s.y : s.x;
      const sy = horizontal ? s.x : s.y;
      minSX = Math.min(minSX, sx);
      maxSX = Math.max(maxSX, sx);
      minSY = Math.min(minSY, sy);
      maxSY = Math.max(maxSY, sy);
    }
    if (!isFinite(minSX))
      return { x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 };
    return {
      zoom: 1,
      x: window.innerWidth / 2 - (minSX + maxSX) / 2,
      y: window.innerHeight / 2 - (minSY + maxSY) / 2,
    };
  }, [idx2sbj, horizontal]);

  return (
    <InfiniteCanvas
      className="sbj-cnvs"
      marqueeSuppressSelector=".sbj-cnvs-item"
      onItemDragEnd={onItemDragEnd}
      onMarqueeSelect={onMarqueeSelect}
      onFitRequest={onFitRequest}
      controls={
        <>
          <Toggle key={currentProjectId ?? "draft"} offLabel="세로" onLabel="가로" defaultOn={horizontal} onChange={setHorizontal} />
          <BttnAutoLayout onDown={onAutoLayout} className="-big" />
        </>
      }
    >
      <SbjCnvsInner
        itemsRef={itemsRef}
        bboxMapRef={bboxMapRef}
        horizontal={horizontal}
      />
    </InfiniteCanvas>
  );
};

export default SbjCnvs;
