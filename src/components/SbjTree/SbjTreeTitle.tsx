import { useState } from "react";
import { useSubjectStore } from "../../context/SubjectProvider";
import type { Course } from "../../types/Curriculum";
import type { InsertMode } from "../../types/InsertMode";
import { useDragGhost } from "../../hooks/useDragGhost";
import { makeClassName } from "../../utils/makeClassName";

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
  const { isDrag, clearDrag, delCrs, selCrsDrag, setSbjBro, setSbjMom } =
    useSubjectStore();
  const { down, ref } = useDragGhost<HTMLDivElement>();
  const [moveState, setMoveState] = useState<InsertMode | null>(null);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (moveState === "PREVIOUS") setSbjBro(info.idx, moveState);
    else if (moveState === "NEXT") setSbjMom(info.idx);
    clearDrag();
    setMoveState(null);
  };

  const onLeave = () => setMoveState(null);

  const onMove = (e: PE) => {
    e.preventDefault();
    if (!ref.current || !isDrag) return;
    const rect = ref.current.getBoundingClientRect();
    const dy = e.clientY - rect.top;
    if (dy < 0.5 * rect.height) setMoveState("PREVIOUS");
    else setMoveState("NEXT");
  };

  const onDown = (e: PE) => {
    e.preventDefault();
    down(e);
    selCrsDrag(info.idx);
  };

  return (
    <div
      ref={ref}
      className={makeClassName(
        "sbj-tree-title",
        "sbj-tree-up",
        moveState === "PREVIOUS" && "pre",
        moveState === "NEXT" && "nxt"
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
