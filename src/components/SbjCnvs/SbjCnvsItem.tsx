import React, { useCallback, useRef, useState } from "react";
import { makeClassName } from "../../utils/makeClassName";
import SbjCnvsCurve from "./SbjCnvsCurve";
import SbjCnvsTitle from "./SbjCnvsTitle";
import { useSubjectStore } from "../../context/useSubjectStore";

type PE = React.PointerEvent | PointerEvent;

type Props = {
  setRef: (x: HTMLDivElement | null) => void;
  // setFrom: () => void;
  idx: number;
  info: { ttl: string; x: number; y: number };
  dxy: { dx: number; dy: number };
  isSelected: boolean;
};

const SbjCnvsItem = ({
  idx,
  setRef,
  // setFrom,
  info,
  dxy: { dx, dy },
  isSelected,
}: Props) => {
  const { setPreFrom, setCnvsPre } = useSubjectStore();
  const [exy, setExy] = useState<{ ex: number; ey: number } | null>(null);
  const outRef = useRef<HTMLDivElement | null>(null);

  const getPxy = useCallback(() => {
    if (!outRef.current) return { px: 0, py: 0 };
    const rect = outRef.current.getBoundingClientRect();
    return { px: rect.left + rect.width / 2, py: rect.top + rect.height / 2 };
  }, []);

  const onGlobalMove = useCallback((e: PE) => {
    setExy({ ex: e.clientX, ey: e.clientY });
  }, []);

  const onGlobalUp = useCallback(() => {
    setExy(null);
    setPreFrom(-1);
    window.removeEventListener("pointermove", onGlobalMove);
    window.removeEventListener("pointerup", onGlobalUp);
  }, [onGlobalMove, setPreFrom]);

  const onDown = useCallback(
    (e: PE) => {
      e.preventDefault();
      setPreFrom(idx);
      window.addEventListener("pointermove", onGlobalMove);
      window.addEventListener("pointerup", onGlobalUp);
    },
    [onGlobalMove, onGlobalUp, setPreFrom, idx]
  );

  const onUp = useCallback(() => {
    setCnvsPre(idx);
  }, [idx, setCnvsPre]);

  return (
    <div>
      <div
        ref={setRef}
        className={makeClassName("sbj-cnvs-item", isSelected && "-slc")}
        style={{
          ["--ex-transform" as string]: `translate(${info.x + dx}px, ${
            info.y + dy
          }px)`,
        }}
      >
        <div className="in" onPointerUp={onUp} />
        <SbjCnvsTitle idx={idx} ttl={info.ttl} />
        <div ref={outRef} className="out" onPointerDown={onDown} />
      </div>
      <SbjCnvsCurve pxy={getPxy()} exy={exy} />
    </div>
  );
};

export default SbjCnvsItem;
