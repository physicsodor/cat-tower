import { useDragGhost } from "../../hooks/useDragGhost";
import React, { useState } from "react";
import { makeClassName } from "../../utils/makeClassName";
import { useSubjectStore } from "../../context/useSubjectStore";
import type { BroDir } from "../../utils/familyOp";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx: number; ttl: string };

const SbjTreeItem = ({ idx, ttl }: Props) => {
  const { slcSet, slcSbj, treeDrag, beginTreeDrag, clearTreeDrag, setTreeBro } =
    useSubjectStore();
  const { ref, down: ghost_down } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);

  /** 위/아래 삽입 */
  const onUp = (e: PE) => {
    e.preventDefault();
    if (dir !== null) setTreeBro(idx, dir);
    clearTreeDrag();
    setDir(null);
  };

  /** 위/아래 삽입에서 벗어남 */
  const onLeave = () => setDir(null);

  /** drag 중 위/아래에 삽입 전 */
  const onMove = (e: PE) => {
    e.preventDefault();
    if (!ref.current || treeDrag.size <= 0 || treeDrag.has(idx)) return;
    const rect = ref.current.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    if (e.clientY > y) setDir("RIGHT");
    else setDir("LEFT");
  };

  /** 선택 후 drag 시작 */
  const onDown = (e: PE) => {
    e.preventDefault();
    const s = slcSbj(e, idx);
    if (s.has(idx)) {
      beginTreeDrag(s);
      ghost_down(e);
    }
  };

  return (
    <div
      ref={ref}
      className={makeClassName(
        "sbj-tree-item",
        "-ovr",
        slcSet.has(idx) && "-slc",
        dir === "LEFT" && "-pre",
        dir === "RIGHT" && "-nxt"
      )}
    >
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onLeave}
      >
        {ttl}
      </div>
    </div>
  );
};

export default SbjTreeItem;
