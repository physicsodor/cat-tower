import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SbjCnvsItem from "./SbjCnvsItem";
import { useSubjectStore } from "../../context/useSubjectStore";
import SbjCnvsCrs from "./SbjCnvsCrs";

type PE = React.PointerEvent | PointerEvent;

const SbjCnvs = () => {
  const {
    getCnvsPxy,
    getCnvsDrag,
    idx2family,
    idx2sbj,
    slcSet,
    setCnvsDrag,
    setCnvsPos,
  } = useSubjectStore();
  const [dxy, setDxy] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const cnvsRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const rafRef = useRef(0);
  const fromRef = useRef(-1);

  const getOxy = useCallback(() => {
    if (!cnvsRef.current) return { ox: 0, oy: 0 };
    const cnvsRect = cnvsRef.current.getBoundingClientRect();
    return { ox: cnvsRect.left, oy: cnvsRect.top };
  }, []);

  const crs2lrtb = useMemo(() => {
    type LRTB = { l: number; r: number; t: number; b: number };
    const map = new Map<number, LRTB>();
    const cnvsDrag = getCnvsDrag();
    const { ox, oy } = getOxy();
    for (const [idx, f] of idx2family) {
      if (idx < 0) continue;
      const kids = f.kids;
      if (!kids) continue;
      let [l, r, t, b]: (number | null)[] = [null, null, null, null];
      for (const k of kids) {
        const { dx, dy } = cnvsDrag.has(k) ? dxy : { dx: 0, dy: 0 };
        const kid = itemsRef.current.get(k);
        if (!kid) continue;
        const rect = kid.getBoundingClientRect();
        if (l === null || l > rect.left + dx) l = rect.left;
        if (r === null || r < rect.right + dx) r = rect.right;
        if (t === null || t > rect.top + dy) t = rect.top;
        if (b === null || b < rect.bottom + dy) b = rect.bottom;
      }
      l = l === null ? 0 : l - ox;
      r = r === null ? 0 : r - ox;
      t = t === null ? 0 : t - oy;
      b = b === null ? 0 : b - oy;
      map.set(idx, { l, r, t, b });
    }
    return map;
  }, [idx2family, getCnvsDrag, dxy, getOxy]);

  const onGlobalMove = useCallback(
    (e: PE) => {
      if (getCnvsDrag().size <= 0) return;
      const { px, py } = getCnvsPxy();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() =>
        setDxy({ dx: e.clientX - px, dy: e.clientY - py })
      );
    },
    [getCnvsDrag, getCnvsPxy]
  );

  const onGlobalUp = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setCnvsPos(getCnvsDrag(), dxy);
    setDxy({ dx: 0, dy: 0 });
    setCnvsDrag(new Set());
  }, [getCnvsDrag, setCnvsDrag, setCnvsPos, dxy]);

  useEffect(() => {
    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
    };
  }, [onGlobalMove, onGlobalUp]);

  const setFrom = useCallback((idx: number) => {
    fromRef.current = idx;
  }, []);
  const getFrom = useCallback(() => fromRef.current, []);

  return (
    <div ref={cnvsRef} className="sbj-cnvs">
      <div>
        {[...crs2lrtb].map(([idx, lrtb]) => (
          <SbjCnvsCrs
            key={`sbj-cnvs-crs-${idx}`}
            setRef={(x) => {
              if (x) itemsRef.current.set(idx, x);
              else itemsRef.current.delete(idx);
            }}
            {...{ idx, ...lrtb }}
          />
        ))}
      </div>
      <div>
        {[...idx2sbj].map(([idx, s]) => {
          if (s.sbjType === "SUBJECT") {
            const isSelected = slcSet.has(idx);
            return (
              <SbjCnvsItem
                key={`sbj-cnvs-item-${idx}`}
                setRef={(x) => {
                  if (x) itemsRef.current.set(idx, x);
                  else itemsRef.current.delete(idx);
                }}
                setFrom={() => setFrom(idx)}
                getFrom={getFrom}
                idx={idx}
                info={{ ttl: s.ttl, x: s.x, y: s.y }}
                dxy={isSelected ? dxy : { dx: 0, dy: 0 }}
                oxy={getOxy()}
                isSelected={isSelected}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default SbjCnvs;
