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

const SbjCnvs = () => {
  const { cnvsDragStart, cnvsDrag, idx2family, idx2sbj, setCnvsPos } = useSbjData();
  const { selectMany } = useSbjSelect();
  const [dxy, setDxy] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [lrtbMap, setLrtbMap] = useState(new Map<number, LRTB>());
  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const rafRef = useRef(0);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const marqueeRef = useRef<Marquee | null>(null);

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

  const onBgDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest(".sbj-cnvs-item")) return;
    const m: Marquee = { startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY };
    marqueeRef.current = m;
    setMarquee(m);
  }, []);

  const onGlobalMove = useCallback(
    (e: PE) => {
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
    cancelAnimationFrame(rafRef.current);
    if (cnvsDrag.get().size > 0) {
      setCnvsPos(cnvsDrag.get(), {
        dx: Math.round(dxy.dx),
        dy: Math.round(dxy.dy),
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

  useEffect(() => {
    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
    };
  }, [onGlobalMove, onGlobalUp]);

  return (
    <div className="sbj-cnvs" onPointerDown={onBgDown}>
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} back />
      <SbjCnvsCurveContainer lrtbMap={lrtbMap} />
      <SbjCnvsCrsContainer lrtbMap={lrtbMap} items={itemsRef.current} />
      <SbjCnvsItemContainer dxy={dxy} items={itemsRef.current} />
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
    </div>
  );
};

export default SbjCnvs;
