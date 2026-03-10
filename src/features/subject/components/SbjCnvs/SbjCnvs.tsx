import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import SbjCnvsCurveContainer from "./SbjCnvsCurveContainer";
import SbjCnvsCrsContainer from "./SbjCnvsCrsContainer";
import SbjCnvsItemContainer from "./SbjCnvsItemContainer";
import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSelect } from "../../context/SbjSelectContext";
import InfiniteCanvas, {
  useInfiniteCanvas,
  type Camera,
} from "@/components/InfiniteCanvas";

type LRTB = { l: number; r: number; t: number; b: number };

// ── Inner content (reads camera/dxy from InfiniteCanvasContext) ───────────────

type InnerProps = {
  itemsRef: React.MutableRefObject<Map<number, HTMLDivElement | null>>;
  lrtbMapRef: React.MutableRefObject<Map<number, LRTB>>;
};

const SbjCnvsInner = ({ itemsRef, lrtbMapRef }: InnerProps) => {
  const { camera, dxy } = useInfiniteCanvas();
  const { idx2family, syncCamera } = useSbjData();

  useEffect(() => {
    syncCamera(camera);
  }, [camera, syncCamera]);
  const [lrtbMap, setLrtbMap] = useState(new Map<number, LRTB>());

  useLayoutEffect(() => {
    const map = new Map<number, LRTB>();
    const getItemLRTB = (idx: number): LRTB | null => {
      const item = itemsRef.current.get(idx);
      if (!item) return null;
      const rect = item.getBoundingClientRect();
      return { l: rect.left, r: rect.right, t: rect.top, b: rect.bottom };
    };
    for (const [idx, f] of idx2family) {
      if (idx < 0) continue;
      const kids = f.kids;
      if (!kids) {
        if (map.get(idx)) continue;
        const lrtb = getItemLRTB(idx);
        if (lrtb) map.set(idx, lrtb);
        continue;
      }
      let lrtb: LRTB | null = null;
      for (const k of kids) {
        const kidLrtb = getItemLRTB(k);
        if (!kidLrtb) continue;
        if (lrtb === null) lrtb = kidLrtb;
        else
          lrtb = {
            l: Math.min(lrtb.l, kidLrtb.l),
            r: Math.max(lrtb.r, kidLrtb.r),
            t: Math.min(lrtb.t, kidLrtb.t),
            b: Math.max(lrtb.b, kidLrtb.b),
          };
      }
      if (lrtb !== null) map.set(idx, lrtb);
    }
    setLrtbMap(map);
    lrtbMapRef.current = map;
  }, [idx2family, dxy, camera, lrtbMapRef, itemsRef]);

  return (
    <>
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} back />
      <SbjCnvsCurveContainer lrtbMap={lrtbMap} zoom={camera.zoom} />
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} />
      <SbjCnvsItemContainer items={itemsRef.current} />
    </>
  );
};

// ── Outer wrapper ─────────────────────────────────────────────────────────────

const SbjCnvs = () => {
  const { cnvsDrag, idx2sbj, setCnvsPos } = useSbjData();
  const { selectMany } = useSbjSelect();
  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const lrtbMapRef = useRef(new Map<number, LRTB>());

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
    ) => {
      const selected = new Set<number>();
      for (const [idx, lrtb] of lrtbMapRef.current) {
        if (idx < 0) continue;
        const s = idx2sbj.get(idx);
        if (!s || s.sbjType !== "SUBJECT") continue;
        if (mode === "window") {
          if (
            lrtb.l >= selL &&
            lrtb.r <= selR &&
            lrtb.t >= selT &&
            lrtb.b <= selB
          )
            selected.add(idx);
        } else {
          if (lrtb.l < selR && lrtb.r > selL && lrtb.t < selB && lrtb.b > selT)
            selected.add(idx);
        }
      }
      selectMany(selected);
    },
    [idx2sbj, selectMany],
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
    >
      <SbjCnvsInner itemsRef={itemsRef} lrtbMapRef={lrtbMapRef} />
    </InfiniteCanvas>
  );
};

export default SbjCnvs;
