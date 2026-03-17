import { createContext, useContext } from "react";

export type Camera = { x: number; y: number; zoom: number };

export type InfiniteCanvasCtx = {
  camera: Camera;
  dxy: { dx: number; dy: number };
  /** Call on pointerdown when an item drag begins. */
  startItemDrag: (startX: number, startY: number) => void;
  /** Programmatically set the camera (e.g. for fit-to-content). */
  setCamera: (camera: Camera) => void;
};

export const InfiniteCanvasContext = createContext<InfiniteCanvasCtx | null>(null);

export const useInfiniteCanvas = (): InfiniteCanvasCtx => {
  const ctx = useContext(InfiniteCanvasContext);
  if (!ctx) throw new Error("useInfiniteCanvas must be used inside <InfiniteCanvas>");
  return ctx;
};
