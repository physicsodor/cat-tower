import { useCallback, useRef, useState } from "react";
import SbjCnvsTitle from "./SbjCnvsTitle";
import SbjCnvsCurve from "./SbjCnvsCurve";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjData } from "../../context/SbjDataContext";

type PE = React.PointerEvent | PointerEvent;
type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  info: {
    title: string;
    content: string;
    description: string;
    x: number;
    y: number;
  };
  dxy: { dx: number; dy: number };
  camera: { x: number; y: number; zoom: number };
  isSelected: boolean;
  isPre: boolean;
  isNxt: boolean;
  onHoverChange: (idx: number | null) => void;
};

const SbjCnvsItem = ({
  setRef,
  idx,
  info,
  dxy: { dx, dy },
  camera,
  isSelected,
  isPre,
  isNxt,
  onHoverChange,
}: Props) => {
  const { setCnvsPre, preSource } = useSbjData();
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isOver, setIsOver] = useState(false);
  const outRef = useRef<HTMLDivElement | null>(null);

  const getSourcePos = useCallback(() => {
    if (!outRef.current) return { x: 0, y: 0 };
    const rect = outRef.current.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const onGlobalMove = useCallback((e: PE) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const onGlobalUp = useCallback(() => {
    setMousePos(null);
    preSource.set(-1);
    window.removeEventListener("pointermove", onGlobalMove);
    window.removeEventListener("pointerup", onGlobalUp);
  }, [onGlobalMove, preSource]);

  const onDown = useCallback(
    (e: PE) => {
      if (e.button !== 0) return;
      e.preventDefault();
      preSource.set(idx);
      window.addEventListener("pointermove", onGlobalMove);
      window.addEventListener("pointerup", onGlobalUp);
    },
    [onGlobalMove, onGlobalUp, preSource, idx]
  );

  const onUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setCnvsPre(idx);
    },
    [idx, setCnvsPre]
  );

  const viewX = camera.x + info.x * camera.zoom + dx;
  const viewY = camera.y + info.y * camera.zoom + dy;

  return (
    <div
      onMouseOver={() => { setIsOver(true); onHoverChange(idx); }}
      onMouseLeave={() => { setIsOver(false); onHoverChange(null); }}
    >
      <div
        ref={setRef}
        className={makeClassName("sbj-cnvs-item", isSelected && "-slc", isPre && "-pre", isNxt && "-nxt")}
        style={{
          transform: `translate(${viewX}px, ${viewY}px) scale(${camera.zoom}) translate(-50%, -50%)`,
        }}
      >
        {isOver ? (
          <div className="sum">
            <div>{info.title}</div>
            <div>{!info.content ? "내용" : info.content}</div>
            <div>{!info.description ? "설명" : info.description}</div>
            <div></div>
          </div>
        ) : null}
        <div className="in" onPointerUp={onUp} />
        <SbjCnvsTitle idx={idx} title={info.title} />
        <div ref={outRef} className="out" onPointerDown={onDown} />
      </div>
      <SbjCnvsCurve sourcePos={getSourcePos()} mousePos={mousePos} />
    </div>
  );
};

export default SbjCnvsItem;
