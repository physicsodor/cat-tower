import { useCallback, useMemo, useRef, useState } from "react";
import SbjCnvsTitle from "./SbjCnvsTitle";
import SbjCnvsCurve from "./SbjCnvsCurve";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjData } from "../../context/SbjDataContext";
import { stripMarkup, truncateBytes } from "../../utils/markup";

type PE = React.PointerEvent | PointerEvent;

const getDesc = (info: { description: string; content: string }): string => {
  if (info.description) return info.description;
  if (info.content) {
    const plain = stripMarkup(info.content).trim();
    return plain ? truncateBytes(plain, 20, "...") : "내용 없음";
  }
  return "내용 없음";
};
type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  info: {
    title: string;
    short?: string;
    content: string;
    description: string;
    x: number;
    y: number;
  };
  dxy: { dx: number; dy: number };
  camera: { x: number; y: number; zoom: number };
  isSelected: boolean;
  isHovered: boolean;
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
  isHovered,
  isPre,
  isNxt,
  onHoverChange,
}: Props) => {
  const { setCnvsPre, preSource, delSbjOne, openEdit } = useSbjData();
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isOver, setIsOver] = useState(false);
  const outRef = useRef<HTMLDivElement | null>(null);
  const desc = useMemo(() => getDesc(info), [info.description, info.content]);

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
    window.removeEventListener("pointercancel", onGlobalUp);
  }, [onGlobalMove, preSource]);

  const onDown = useCallback(
    (e: PE) => {
      if (e.button !== 0) return;
      e.preventDefault();
      preSource.set(idx);
      window.addEventListener("pointermove", onGlobalMove);
      window.addEventListener("pointerup", onGlobalUp);
      window.addEventListener("pointercancel", onGlobalUp);
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
        className={makeClassName("sbj-cnvs-item", isSelected && "-slc", isHovered && "-hvr", isPre && "-pre", isNxt && "-nxt")}
        style={{
          transform: `translate(${viewX}px, ${viewY}px) scale(${camera.zoom}) translate(-50%, -50%)`,
        }}
      >
        {isOver ? (
          <div className="sbj-cnvs-item-sum">
            <div>{info.title}</div>
            <div>{desc}</div>
          </div>
        ) : null}
        <div className="sbj-cnvs-item-acts">
          <button className="sbj-cnvs-item-act -edt" onPointerDown={(e) => e.stopPropagation()} onClick={() => openEdit(idx)}>✱</button>
          <button className="sbj-cnvs-item-act -del" onPointerDown={(e) => e.stopPropagation()} onClick={() => delSbjOne(idx)}>✕</button>
        </div>
        <div className="sbj-cnvs-item-in" onPointerUp={onUp} />
        <SbjCnvsTitle idx={idx} title={info.short || info.title} />
        <div ref={outRef} className="sbj-cnvs-item-out" onPointerDown={onDown} />
      </div>
      <SbjCnvsCurve sourcePos={getSourcePos()} mousePos={mousePos} zoom={camera.zoom} />
    </div>
  );
};

export default SbjCnvsItem;
