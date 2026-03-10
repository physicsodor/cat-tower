import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { InfiniteCanvasContext, type Camera } from "./InfiniteCanvasContext";
import "./InfiniteCanvas.scss";

type PE = React.PointerEvent | PointerEvent;
type Marquee = { startX: number; startY: number; curX: number; curY: number };

type Props = {
  children: ReactNode;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  /**
   * CSS selector: if the pointer-down target matches this selector,
   * marquee selection will not start (e.g. ".my-item").
   */
  marqueeSuppressSelector?: string;
  /** Called when an item drag ends with world-space delta. */
  onItemDragEnd?: (worldDx: number, worldDy: number) => void;
  /** Called with the screen-space marquee box after mouse release. */
  onMarqueeSelect?: (
    selL: number,
    selR: number,
    selT: number,
    selB: number,
    mode: "window" | "cross",
  ) => void;
  /**
   * Called when the fit button is pressed.
   * Return the desired Camera, or null to do nothing.
   * If not provided, the fit button is not rendered.
   */
  onFitRequest?: () => Camera | null;
};

/**
 * InfiniteCanvas — pan, zoom, item drag, marquee selection.
 *
 * Controls:
 *   Right-click drag   → pan
 *   Scroll wheel       → zoom (centered on cursor)
 *   Two-finger pinch   → zoom (touch)
 *   startItemDrag()    → item drag (expose via useInfiniteCanvas context)
 *   Left-click + drag  → marquee selection
 *
 * Dependencies: react only (no external canvas library).
 * Self-contained: import InfiniteCanvas + InfiniteCanvas.scss (auto-imported here).
 */
const InfiniteCanvas = ({
  children,
  className,
  minZoom = 0.5,
  maxZoom = 1.0,
  marqueeSuppressSelector,
  onItemDragEnd,
  onMarqueeSelect,
  onFitRequest,
}: Props) => {
  const [camera, setCamera] = useState<Camera>(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    zoom: 1,
  }));
  const cameraRef = useRef<Camera>(camera);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const [dxy, setDxy] = useState({ dx: 0, dy: 0 });
  // Ref copy for reading in callbacks without creating dep cycles
  const dxyRef = useRef({ dx: 0, dy: 0 });

  // Right-click pan
  const isPanning = useRef(false);
  const panStart = useRef({ px: 0, py: 0, cx: 0, cy: 0 });

  // Item drag
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);

  const startItemDrag = useCallback((startX: number, startY: number) => {
    isDragging.current = true;
    dragStart.current = { x: startX, y: startY };
  }, []);

  // Marquee
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const marqueeRef = useRef<Marquee | null>(null);

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

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const onBgDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
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
      if (
        marqueeSuppressSelector &&
        (e.target as Element).closest(marqueeSuppressSelector)
      )
        return;
      const m: Marquee = {
        startX: e.clientX,
        startY: e.clientY,
        curX: e.clientX,
        curY: e.clientY,
      };
      marqueeRef.current = m;
      setMarquee(m);
    },
    [marqueeSuppressSelector],
  );

  const onGlobalMove = useCallback((e: PE) => {
    if (isPanning.current) {
      const { px, py, cx, cy } = panStart.current;
      setCamera((prev) => ({
        ...prev,
        x: cx + e.clientX - px,
        y: cy + e.clientY - py,
      }));
      return;
    }
    if (isPinching.current) return;
    if (isDragging.current) {
      const newDxy = {
        dx: e.clientX - dragStart.current.x,
        dy: e.clientY - dragStart.current.y,
      };
      dxyRef.current = newDxy;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setDxy({ ...newDxy }));
      return;
    }
    const m = marqueeRef.current;
    if (m) {
      const updated: Marquee = { ...m, curX: e.clientX, curY: e.clientY };
      marqueeRef.current = updated;
      setMarquee({ ...updated });
    }
  }, []);

  const onGlobalUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (isPinching.current) return;

    cancelAnimationFrame(rafRef.current);

    if (isDragging.current) {
      isDragging.current = false;
      const { dx, dy } = dxyRef.current;
      const zoom = cameraRef.current.zoom;
      onItemDragEnd?.(dx / zoom, dy / zoom);
      dxyRef.current = { dx: 0, dy: 0 };
      setDxy({ dx: 0, dy: 0 });
    }

    const m = marqueeRef.current;
    if (m) {
      const selL = Math.min(m.startX, m.curX);
      const selR = Math.max(m.startX, m.curX);
      const selT = Math.min(m.startY, m.curY);
      const selB = Math.max(m.startY, m.curY);
      const mode = m.curX >= m.startX ? "window" : "cross";
      onMarqueeSelect?.(selL, selR, selT, selB, mode);
      marqueeRef.current = null;
      setMarquee(null);
    }
  }, [onItemDragEnd, onMarqueeSelect]);

  // Wheel zoom centered on cursor
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setCamera((prev) => {
        const newZoom = Math.max(
          minZoom,
          Math.min(maxZoom, prev.zoom * factor),
        );
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
  }, [minZoom, maxZoom]);

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
        pinchStart.current = {
          dist,
          midX,
          midY,
          camX: cam.x,
          camY: cam.y,
          camZoom: cam.zoom,
        };
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
        const newZoom = Math.max(
          minZoom,
          Math.min(maxZoom, ps.camZoom * (dist / ps.dist)),
        );
        const ratio = newZoom / ps.camZoom;
        setCamera({
          zoom: newZoom,
          x: midX - (ps.midX - ps.camX) * ratio,
          y: midY - (ps.midY - ps.camY) * ratio,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of e.changedTouches)
        touchPoints.current.delete(t.identifier);
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
  }, [minZoom, maxZoom]);

  useEffect(() => {
    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
    };
  }, [onGlobalMove, onGlobalUp]);

  const onZoomReset = useCallback(() => {
    setCamera((prev) => {
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

  const onFit = useCallback(() => {
    if (!onFitRequest) return;
    const newCamera = onFitRequest();
    if (newCamera) setCamera(newCamera);
  }, [onFitRequest]);

  const ctxValue = useMemo(
    () => ({ camera, dxy, startItemDrag }),
    [camera, dxy, startItemDrag],
  );

  return (
    <InfiniteCanvasContext.Provider value={ctxValue}>
      <div
        ref={canvasRef}
        className={className}
        onPointerDown={onBgDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
        {marquee && (
          <div
            className={`ic-marquee${marquee.curX >= marquee.startX ? " -window" : " -cross"}`}
            style={{
              left: Math.min(marquee.startX, marquee.curX),
              top: Math.min(marquee.startY, marquee.curY),
              width: Math.abs(marquee.curX - marquee.startX),
              height: Math.abs(marquee.curY - marquee.startY),
            }}
          />
        )}
        <div className="ic-controls">
          <div className="ic-controls-btns">
            {onFitRequest && (
              <button className="ic-btn" onClick={onFit} title="Fit all">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="3.5" y="3.5" width="9" height="9" rx="0.5" />
                  <path d="M1 4V1h3M15 4V1h-3M1 12v3h3M15 12v3h-3" />
                </svg>
              </button>
            )}
            <button
              className="ic-btn"
              onClick={onZoomReset}
              title="Reset to 100%"
            >
              1:1
            </button>
          </div>
          <div className="ic-zoom-label">{Math.round(camera.zoom * 100)}%</div>
        </div>
      </div>
    </InfiniteCanvasContext.Provider>
  );
};

export default InfiniteCanvas;
