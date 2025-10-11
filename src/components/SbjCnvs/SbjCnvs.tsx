import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SbjCnvsItem from "./SbjCnvsItem";
import { useSubjectStore } from "../../context/useSubjectStore";
import SbjCnvsCrs from "./sbjCnvsCrs";

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

  const crs2lrtb = useMemo(() => {
    type LRTB = { l: number; r: number; t: number; b: number };
    if (!cnvsRef.current) return new Map<number, LRTB>();
    const cnvsRect = cnvsRef.current.getBoundingClientRect();
    const [x0, y0] = [cnvsRect.left, cnvsRect.top];
    const map = new Map<number, LRTB>();
    const cnvsDrag = getCnvsDrag();
    for (const [idx, f] of idx2family) {
      let [l, r, t, b]: (number | null)[] = [null, null, null, null];
      if (idx < 0) continue;
      const kids = f.kids;
      if (!kids) continue;
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
      l = l === null ? 0 : l - x0;
      r = r === null ? 0 : r - x0;
      t = t === null ? 0 : t - y0;
      b = b === null ? 0 : b - y0;
      map.set(idx, { l, r, t, b });
    }
    return map;
  }, [idx2family, getCnvsDrag, dxy]);

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
                idx={idx}
                info={{ ttl: s.ttl, x: s.x, y: s.y }}
                dxy={isSelected ? dxy : { dx: 0, dy: 0 }}
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
