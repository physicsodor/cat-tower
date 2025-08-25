import { useCallback, useRef } from "react";

export const useDragGhost = <T extends HTMLElement = HTMLElement>() => {
  const targetRef = useRef<T | null>(null);
  const ghostRef = useRef<HTMLElement>(null);
  const pxyRef = useRef<number[]>([0, 0]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    ghost.style.transform = `translate(${e.clientX - pxyRef.current[0]}px, ${
      e.clientY - pxyRef.current[1]
    }px)`;
  }, []);

  const onPointerUp = useCallback(() => {
    const ghost = ghostRef.current;
    if (ghost) document.body.removeChild(ghost);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<T>) => {
      e.preventDefault();

      if (e.button !== 0) return;
      pxyRef.current = [e.clientX, e.clientY];

      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const ghost = target.cloneNode(true) as HTMLElement;
      ghost.className = "ghost";
      ghost.style.left = `${pxyRef.current[0]}px`;
      ghost.style.top = `${pxyRef.current[1]}px`;
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      document.body.appendChild(ghost);
      ghostRef.current = ghost;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [onPointerMove, onPointerUp]
  );

  return {
    ref: targetRef,
    down: onPointerDown,
  };
};
