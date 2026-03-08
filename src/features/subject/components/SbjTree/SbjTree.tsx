import { useRef, useState } from "react";
import AuthDebug from "@/features/auth/AuthDebug";
import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSyncStore } from "../../context/SbjSyncContext";
import SbjTreeBox from "./SbjTreeBox";

const SbjTree = () => {
  const { addCrs, addSbj, delSbj } = useSbjData();
  const { saveNow } = useSbjSyncStore();

  const [pos, setPos] = useState({ x: 16, y: 16 });
  const [open, setOpen] = useState(true);

  const drag = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
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
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
    setPos({ x: drag.current.originX + dx, y: drag.current.originY + dy });
  };

  const onPointerUp = () => {
    if (drag.current && !drag.current.moved) setOpen((o) => !o);
    drag.current = null;
  };

  return (
    <div
      className="sbj-ctrl"
      style={{ left: pos.x, top: pos.y, transform: "none" }}
    >
      <div
        className="sbj-ctrl-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg viewBox="0 0 24 24" width="32" height="32">
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
      <div className={`sbj-ctrl-panel${open ? " open" : ""}`}>
        <AuthDebug />
        <div className="sbj-ctrl-btns">
          <button onClick={saveNow}>저장</button>
          <button onClick={addSbj}>추가</button>
          <button onClick={delSbj}>제거</button>
          <button onClick={addCrs}>그룹 만들기</button>
        </div>
        <SbjTreeBox />
      </div>
    </div>
  );
};

export default SbjTree;
