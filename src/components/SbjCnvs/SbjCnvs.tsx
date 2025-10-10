import React, { useCallback, useEffect, useRef, useState } from "react";
import SbjCnvsItem from "./SbjCnvsItem";
import { useSubjectStore } from "../../context/useSubjectStore";

type PE = React.PointerEvent | PointerEvent;

const SbjCnvs = () => {
  const { getCnvsPxy, getCnvsDrag, list, slcSet, setCnvsDrag, setCnvsPos } =
    useSubjectStore();
  // const [pxy, setPxy] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
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
      {list.map((s) => {
        if (s.sbjType === "SUBJECT") {
          const isSelected = slcSet.has(s.idx);
          return (
            <SbjCnvsItem
              key={`sbj-cnvs-item-${s.idx}`}
              info={s}
              dxy={isSelected ? dxy : { dx: 0, dy: 0 }}
              isSelected={isSelected}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default SbjCnvs;
