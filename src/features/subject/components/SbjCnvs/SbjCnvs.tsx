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
import { useSbjStore } from "../../context/SbjContext";

type PE = React.PointerEvent | PointerEvent;
type LRTB = { l: number; r: number; t: number; b: number };

const SbjCnvs = () => {
  const { cnvsDragStart, cnvsDrag, idx2family, setCnvsPos } = useSbjStore();
  const [dxy, setDxy] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [lrtbMap, setLrtbMap] = useState(new Map<number, LRTB>());
  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const rafRef = useRef(0);

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
  }, [idx2family, dxy]);

  const onGlobalMove = useCallback(
    (e: PE) => {
      if (cnvsDrag.get().size <= 0) return;
      const { x, y } = cnvsDragStart.get();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() =>
        setDxy({ dx: e.clientX - x, dy: e.clientY - y })
      );
    },
    [cnvsDrag, cnvsDragStart]
  );

  const onGlobalUp = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setCnvsPos(cnvsDrag.get(), {
      dx: Math.round(dxy.dx),
      dy: Math.round(dxy.dy),
    });
    setDxy({ dx: 0, dy: 0 });
    cnvsDrag.set(new Set());
  }, [cnvsDrag, setCnvsPos, dxy]);

  useEffect(() => {
    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
    };
  }, [onGlobalMove, onGlobalUp]);

  return (
    <div className="sbj-cnvs">
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} back />
      <SbjCnvsCurveContainer lrtbMap={lrtbMap} />
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} />
      <SbjCnvsItemContainer dxy={dxy} items={itemsRef.current} />
    </div>
  );
};

export default SbjCnvs;
