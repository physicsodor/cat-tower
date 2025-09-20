import { useState } from "react";
import type { Course } from "../../types/Curriculum";
import type { InsertMode } from "../../types/InsertMode";
import { useDragGhost } from "../../hooks/useDragGhost";
import { makeClassName } from "../../utils/makeClassName";
import { useCurriculumStore } from "../../context/useCurriculumStore";

type PE = React.PointerEvent<HTMLDivElement>;

const SbjTreeTitle = ({
  info,
  isOpen,
  onToggle,
}: {
  info: Course;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const {
    isTreeDrag: isDrag,
    clearTreeDrag: clearDrag,
    delCrs,
    selTreeCrsDrag,
    setSbjBro,
    setSbjMom,
  } = useCurriculumStore();
  const { down, ref } = useDragGhost<HTMLDivElement>();
  const [moveState, setMoveState] = useState<InsertMode | null>(null);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (moveState === "LEFT") setSbjBro(info.idx, moveState);
    else if (moveState === "RIGHT") setSbjMom(info.idx);
    clearDrag();
    setMoveState(null);
  };

  const onLeave = () => setMoveState(null);

  const onMove = (e: PE) => {
    e.preventDefault();
    if (!ref.current || !isDrag) return;
    const rect = ref.current.getBoundingClientRect();
    const dy = e.clientY - rect.top;
    if (dy < 0.5 * rect.height) setMoveState("LEFT");
    else setMoveState("RIGHT");
  };

  const onDown = (e: PE) => {
    e.preventDefault();
    down(e);
    selTreeCrsDrag(info.idx);
  };

  return (
    <div
      ref={ref}
      className={makeClassName(
        "sbj-tree-title",
        "sbj-tree-up",
        moveState === "LEFT" && "pre",
        moveState === "RIGHT" && "nxt"
      )}
    >
      {info.idx >= 0 ? (
        <div onPointerDown={onDown}>
          <button>=</button>
        </div>
      ) : null}
      <div onPointerMove={onMove} onPointerLeave={onLeave} onPointerUp={onUp}>
        {info.ttl}
      </div>
      <button onClick={onToggle}>{isOpen ? "-" : "+"}</button>
      {info.idx >= 0 ? <button onClick={delCrs(info.idx)}>제거</button> : null}
    </div>
  );
};

export default SbjTreeTitle;
