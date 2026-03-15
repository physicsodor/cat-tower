import {
  useEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { Camera } from "./InfiniteCanvasContext";

export const useWheelZoom = (
  canvasRef: RefObject<HTMLDivElement | null>,
  minZoom: number,
  maxZoom: number,
  setCamera: Dispatch<SetStateAction<Camera>>,
): void => {
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
  }, [canvasRef, minZoom, maxZoom, setCamera]);
};
