import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from "react";
import type { Camera } from "./InfiniteCanvasContext";

export const useTouchPinch = (
  canvasRef: RefObject<HTMLDivElement>,
  minZoom: number,
  maxZoom: number,
  cameraRef: MutableRefObject<Camera>,
  setCamera: Dispatch<SetStateAction<Camera>>,
  isPinching: MutableRefObject<boolean>,
): void => {
  const touchPoints = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{
    dist: number;
    midX: number;
    midY: number;
    camX: number;
    camY: number;
    camZoom: number;
  } | null>(null);

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
  }, [canvasRef, minZoom, maxZoom, cameraRef, setCamera, isPinching]);
};
