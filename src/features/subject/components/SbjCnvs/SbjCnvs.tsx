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

type PE = React.PointerEvent | PointerEvent;
type LRTB = { l: number; r: number; t: number; b: number };
type Marquee = { startX: number; startY: number; curX: number; curY: number };
type Camera = { x: number; y: number; zoom: number };

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;

const SbjCnvs = () => {
  const { cnvsDragStart, cnvsDrag, idx2family, idx2sbj, setCnvsPos } = useSbjData();
  const { selectMany } = useSbjSelect();
  const [dxy, setDxy] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [lrtbMap, setLrtbMap] = useState(new Map<number, LRTB>());
  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const rafRef = useRef(0);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const marqueeRef = useRef<Marquee | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Camera: x,y = viewport position of world origin; zoom = scale factor
  const [camera, setCamera] = useState<Camera>(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    zoom: 1,
  }));
  const cameraRef = useRef<Camera>(camera);
  useEffect(() => { cameraRef.current = camera; }, [camera]);

  // Right-click pan
  const isPanning = useRef(false);
  const panStart = useRef({ px: 0, py: 0, cx: 0, cy: 0 });

  // Touch pinch
  const isPinching = useRef(false);
  const touchPoints = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{
    dist: number;
    midX: number;
    midY: number;
    camX: number;
    camY: number;
    camZoom: number;
  } | null>(null);

  useLayoutEffect(() => {
    const map = new Map<number, LRTB>();
    const _getItemLRTB = (idx: number): LRTB | null => {
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
        const lrtb = _getItemLRTB(idx);
        if (lrtb) map.set(idx, lrtb);
        continue;
      }
      let lrtb: LRTB | null = null;
      for (const k of kids) {
        const kidLrtb = _getItemLRTB(k);
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
  }, [idx2family, dxy, camera]);

  const onBgDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      isPanning.current = true;
      panStart.current = {
        px: e.clientX,
        py: e.clientY,
        cx: cameraRef.current.x,
        cy: cameraRef.current.y,
      };
      return;
    }
    if (e.button !== 0 || isPinching.current) return;
    if ((e.target as Element).closest(".sbj-cnvs-item")) return;
    const m: Marquee = { startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY };
    marqueeRef.current = m;
    setMarquee(m);
  }, []);

  const onGlobalMove = useCallback(
    (e: PE) => {
      if (isPanning.current) {
        const { px, py, cx, cy } = panStart.current;
        setCamera(prev => ({ ...prev, x: cx + e.clientX - px, y: cy + e.clientY - py }));
        return;
      }
      if (isPinching.current) return;
      if (cnvsDrag.get().size > 0) {
        const { x, y } = cnvsDragStart.get();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() =>
          setDxy({ dx: e.clientX - x, dy: e.clientY - y })
        );
        return;
      }
      const m = marqueeRef.current;
      if (m) {
        const updated: Marquee = { ...m, curX: e.clientX, curY: e.clientY };
        marqueeRef.current = updated;
        setMarquee({ ...updated });
      }
    },
    [cnvsDrag, cnvsDragStart]
  );

  const onGlobalUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (isPinching.current) return;
    cancelAnimationFrame(rafRef.current);
    if (cnvsDrag.get().size > 0) {
      const zoom = cameraRef.current.zoom;
      setCnvsPos(cnvsDrag.get(), {
        dx: Math.round(dxy.dx / zoom),
        dy: Math.round(dxy.dy / zoom),
      });
      setDxy({ dx: 0, dy: 0 });
      cnvsDrag.set(new Set());
    }
    const m = marqueeRef.current;
    if (m) {
      const selL = Math.min(m.startX, m.curX);
      const selR = Math.max(m.startX, m.curX);
      const selT = Math.min(m.startY, m.curY);
      const selB = Math.max(m.startY, m.curY);
      const leftToRight = m.curX >= m.startX;
      const selected = new Set<number>();
      for (const [idx, lrtb] of lrtbMap) {
        if (idx < 0) continue;
        const s = idx2sbj.get(idx);
        if (!s || s.sbjType !== "SUBJECT") continue;
        if (leftToRight) {
          if (lrtb.l >= selL && lrtb.r <= selR && lrtb.t >= selT && lrtb.b <= selB)
            selected.add(idx);
        } else {
          if (lrtb.l < selR && lrtb.r > selL && lrtb.t < selB && lrtb.b > selT)
            selected.add(idx);
        }
      }
      selectMany(selected);
      marqueeRef.current = null;
      setMarquee(null);
    }
  }, [cnvsDrag, setCnvsPos, dxy, lrtbMap, idx2sbj, selectMany]);

  // Wheel zoom centered on mouse position
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setCamera(prev => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * factor));
        const ratio = newZoom / prev.zoom;
        return {
          zoom: newZoom,
          x: e.clientX - (e.clientX - prev.x) * ratio,
          y: e.clientY - (e.clientY - prev.y) * ratio,
        };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Touch pinch-zoom and pan
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      for (const t of e.changedTouches) {
        touchPoints.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (touchPoints.current.size === 2) {
        e.preventDefault();
        isPinching.current = true;
        const pts = [...touchPoints.current.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const cam = cameraRef.current;
        pinchStart.current = { dist, midX, midY, camX: cam.x, camY: cam.y, camZoom: cam.zoom };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      for (const t of e.changedTouches) {
        touchPoints.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (touchPoints.current.size >= 2 && pinchStart.current) {
        e.preventDefault();
        const pts = [...touchPoints.current.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const ps = pinchStart.current;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ps.camZoom * (dist / ps.dist)));
        const ratio = newZoom / ps.camZoom;
        setCamera({
          zoom: newZoom,
          x: midX - (ps.midX - ps.camX) * ratio,
          y: midY - (ps.midY - ps.camY) * ratio,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of e.changedTouches) {
        touchPoints.current.delete(t.identifier);
      }
      if (touchPoints.current.size < 2) {
        isPinching.current = false;
        pinchStart.current = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
    };
  }, [onGlobalMove, onGlobalUp]);

  // 100% zoom reset centered on viewport center
  const onZoomReset = useCallback(() => {
    setCamera(prev => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const ratio = 1 / prev.zoom;
      return {
        zoom: 1,
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      };
    });
  }, []);

  // Fit button: center all items at MIN_ZOOM
  const onFit = useCallback(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [, s] of idx2sbj) {
      if (s.sbjType !== "SUBJECT") continue;
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x);
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y);
    }
    if (!isFinite(minX)) {
      setCamera({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: MIN_ZOOM });
      return;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setCamera({
      zoom: MIN_ZOOM,
      x: window.innerWidth / 2 - cx * MIN_ZOOM,
      y: window.innerHeight / 2 - cy * MIN_ZOOM,
    });
  }, [idx2sbj]);

  return (
    <div
      ref={canvasRef}
      className="sbj-cnvs"
      onPointerDown={onBgDown}
      onContextMenu={onContextMenu}
    >
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} back />
      <SbjCnvsCurveContainer lrtbMap={lrtbMap} />
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} />
      <SbjCnvsItemContainer camera={camera} dxy={dxy} items={itemsRef.current} />
      {marquee && (
        <div
          className={`sbj-cnvs-marquee${marquee.curX >= marquee.startX ? " -window" : " -cross"}`}
          style={{
            left: Math.min(marquee.startX, marquee.curX),
            top: Math.min(marquee.startY, marquee.curY),
            width: Math.abs(marquee.curX - marquee.startX),
            height: Math.abs(marquee.curY - marquee.startY),
          }}
        />
      )}
      <div className="sbj-cnvs-controls">
        <div className="sbj-cnvs-controls-btns">
          <button className="sbj-cnvs-icon-btn" onClick={onFit} title="Fit all">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3.5" y="3.5" width="9" height="9" rx="0.5"/>
              <path d="M1 4V1h3M15 4V1h-3M1 12v3h3M15 12v3h-3"/>
            </svg>
          </button>
          <button className="sbj-cnvs-icon-btn" onClick={onZoomReset} title="Reset to 100%">
            1:1
          </button>
        </div>
        <div className="sbj-cnvs-zoom-label">{Math.round(camera.zoom * 100)}%</div>
      </div>
    </div>
  );
};

export default SbjCnvs;
