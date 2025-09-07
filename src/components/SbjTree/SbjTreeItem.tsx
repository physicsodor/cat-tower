import { useSubjectStore } from "../../context/SubjectProvider";
import type { SelectMode } from "../../types/SelectMode";
import type { Subject } from "../../types/Curriculum";
import { useDragGhost } from "../../hooks/useDragGhost";
import React, { useRef, useState } from "react";
import type { InsertMode } from "../../types/InsertMode";
import { makeClassName } from "../../utils/makeClassName";

const SbjTreeItem = ({ info }: { info: Subject }) => {
  const { clearDrag, isDrag, setSbjBro, selSet, selSbj, selSbjDrag } =
    useSubjectStore();
  const { ref, down: ghost_down } = useDragGhost<HTMLDivElement>();
  const [moveState, setMoveState] = useState<InsertMode | null>(null);
  const modeRef = useRef<SelectMode>("NONE");

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (moveState !== null) setSbjBro(info.idx, moveState);
    clearDrag();
    setMoveState(null);
  };

  const onLeave = () => setMoveState(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!ref.current || !isDrag) return;
    const rect = ref.current.getBoundingClientRect();
    if (e.clientY > rect.top + rect.height / 2) {
      setMoveState("NEXT");
    } else setMoveState("PREVIOUS");
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    modeRef.current = "REPLACE";
    if (e.ctrlKey || e.metaKey) modeRef.current = "ADD";
    else if (e.shiftKey) modeRef.current = "REMOVE";
    else if (selSet.has(info.idx)) modeRef.current = "NONE";
    selSbj(modeRef.current, info.idx);
    if (modeRef.current !== "REMOVE") {
      selSbjDrag(true);
      ghost_down(e);
    }
  };

  return (
    <div
      ref={ref}
      className={makeClassName(
        "sbj-tree-item",
        "sbj-tree-up",
        selSet.has(info.idx) && "selected",
        moveState === "PREVIOUS" && "pre",
        moveState === "NEXT" && "nxt"
      )}
    >
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onLeave}
      >
        {info.idx < 0 ? "Subject Tree:" : info.ttl}
      </div>
    </div>
  );
};

export default SbjTreeItem;
