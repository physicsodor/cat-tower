import React, { useCallback, useEffect, useRef, useState } from "react";
import SbjCnvsItem from "./SbjCnvsItem";
import { useSubjectStore } from "../../context/useSubjectStore";

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
  const rafRef = useRef(0);

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
    <div className="sbj-cnvs">
      <div>
        {[...idx2family].map(([idx, info]) => {
          if (idx < 0) return null;
          let [x1, x2, y1, y2]: (number | null)[] = [null, null, null, null];
          const kids = info.kids ?? [];
          for (const kid of kids) {
            const k = idx2sbj.get(kid);
            if (!k || k.sbjType === "COURSE") return;
            if (x1 === null || k.x < x1) x1 = k.x;
            if (x2 === null || k.x > x2) x2 = k.x;
            if (y1 === null || k.y < y1) y1 = k.y;
            if (y2 === null || k.y > y2) y2 = k.y;
          }
          if (x1 === null || x2 === null || y1 === null || y2 === null)
            return null;
          return (
            <div
              key={`sbj-cnvs-crs-${idx}`}
              className="sbj-cnvs-crs"
              style={{
                position: "absolute",
                width: `${x2 - x1}px`,
                height: `${y2 - y1}px`,
                left: `${x1}px`,
                top: `${y1}px`,
              }}
            ></div>
          );
        })}
      </div>
      <div>
        {[...idx2sbj].map(([idx, s]) => {
          if (s.sbjType === "SUBJECT") {
            const isSelected = slcSet.has(idx);
            return (
              <SbjCnvsItem
                key={`sbj-cnvs-item-${idx}`}
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
