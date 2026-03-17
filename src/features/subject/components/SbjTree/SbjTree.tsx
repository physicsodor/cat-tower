import { useRef, useState } from "react";
import SbjTreeBox from "./SbjTreeBox";
import {
  CTRL_MARGIN as MARGIN,
  CTRL_HANDLE as HANDLE,
  CTRL_DRAG_THRESHOLD,
} from "@/features/subject/constants";
import BttnUndo from "@/components/Bttn/BttnUndo";
import BttnRedo from "@/components/Bttn/BttnRedo";
import { useSbjData } from "../../store/SbjDataContext";

const clampPos = (x: number, y: number) => ({
  x: Math.max(MARGIN, Math.min(x, window.innerWidth - HANDLE - MARGIN)),
  y: Math.max(MARGIN, Math.min(y, window.innerHeight - HANDLE - MARGIN)),
});

const SbjTree = () => {
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { undo, redo, canUndo, canRedo } = useSbjData();

  const drag = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (
      Math.abs(dx) > CTRL_DRAG_THRESHOLD ||
      Math.abs(dy) > CTRL_DRAG_THRESHOLD
    )
      drag.current.moved = true;
    setPos({ x: drag.current.originX + dx, y: drag.current.originY + dy });
  };

  const onPointerUp = () => {
    const moved = drag.current?.moved ?? false;
    drag.current = null;
    setDragging(false);
    setPos((prev) => clampPos(prev.x, prev.y));
    if (!moved) setOpen((o) => !o);
  };

  return (
    <div
      className={`sbj-ctrl${dragging ? " -drag" : ""}`}
      style={{ left: pos.x, top: pos.y, transform: "none" }}
    >
      <div className="sbj-ctrl-header">
        <div
          className="sbj-ctrl-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" />
            {open ? (
              <line x1="7" y1="12" x2="17" y2="12" />
            ) : (
              <>
                <line x1="12" y1="7" x2="12" y2="17" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </>
            )}
          </svg>
        </div>
        <BttnUndo onDown={undo} disabled={!canUndo} className="-lbig" />
        <BttnRedo onDown={redo} disabled={!canRedo} className="-lbig" />
      </div>
      <div className={`sbj-ctrl-panel${open ? " -opn" : ""}`}>
        <div className="sbj-tree-scroll">
          <SbjTreeBox />
        </div>
      </div>
    </div>
  );
};

export default SbjTree;
