import type { Subject } from "../../types/Curriculum";
import { useDragGhost } from "../../hooks/useDragGhost";
import React, { useState } from "react";
import type { InsertMode } from "../../types/InsertMode";
import { makeClassName } from "../../utils/makeClassName";
import { useSubjectStore } from "../../context/useSubjectStore";

const SbjTreeItem = ({ info }: { info: Subject }) => {
  const {
    clearTreeDrag,
    isTreeDrag,
    setSbjBro,
    setSelMode,
    selSet,
    selSbj,
    selTreeSbjDrag,
  } = useSubjectStore();
  const { ref, down: ghost_down } = useDragGhost<HTMLDivElement>();
  const [moveState, setMoveState] = useState<InsertMode | null>(null);

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (moveState !== null) setSbjBro(info.idx, moveState);
    clearTreeDrag();
    setMoveState(null);
  };

  const onLeave = () => setMoveState(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!ref.current || !isTreeDrag) return;
    const rect = ref.current.getBoundingClientRect();
    if (e.clientY > rect.top + rect.height / 2) {
      setMoveState("RIGHT");
    } else setMoveState("LEFT");
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    const mode = setSelMode(e, info.idx);
    selSbj(mode, info.idx);
    if (mode !== "REMOVE") {
      selTreeSbjDrag(true);
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
        moveState === "LEFT" && "pre",
        moveState === "RIGHT" && "nxt"
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
