import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import SbjCnvsItem from "./SbjCnvsItem";
import { useSubjectStore } from "../../context/useSubjectStore";
import SbjCnvsCrs from "./SbjCnvsCrs";

type PE = React.PointerEvent | PointerEvent;
type LRTB = { l: number; r: number; t: number; b: number };

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
  const [lrtbMap, setLrtbMap] = useState(new Map<number, LRTB>());
  const itemsRef = useRef(new Map<number, HTMLDivElement | null>());
  const rafRef = useRef(0);
  const fromRef = useRef(-1);

  useLayoutEffect(() => {
    const map = new Map<number, LRTB>();
    for (const [idx, f] of idx2family) {
      if (idx < 0) continue;
      const kids = f.kids;
      if (!kids) continue;

      let lrtb: LRTB | null = null;
      for (const k of kids) {
        const kid = itemsRef.current.get(k);
        if (!kid) continue;
        const rect = kid.getBoundingClientRect();
        if (lrtb === null)
          lrtb = { l: rect.left, r: rect.right, t: rect.top, b: rect.bottom };
        else
          lrtb = {
            l: Math.min(lrtb.l, rect.left),
            r: Math.max(lrtb.r, rect.right),
            t: Math.min(lrtb.t, rect.top),
            b: Math.max(lrtb.b, rect.bottom),
          };
      }
      if (lrtb !== null) map.set(idx, lrtb);
    }
    setLrtbMap(map);
  }, [idx2family, dxy]);

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
    <div className="sbj-cnvs">
      <div>
        {[...lrtbMap].map(([idx, lrtb]) => (
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
