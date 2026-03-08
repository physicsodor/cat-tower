import { useDragGhost } from "@/hooks/useDragGhost";
import React, { useState } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/features/subject/types/Family/familyOp";
import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSelect } from "../../context/SbjSelectContext";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx: number; title: string };

const SbjTreeItem = ({ idx, title }: Props) => {
  const { treeDrag, setTreeBro } = useSbjData();
  const { selectedSet, selectItem } = useSbjSelect();
  const { ref, down: ghost_down } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);

  /** 선택 후 드래그 입력 */
  const onUp = (e: PE) => {
    e.preventDefault();
    if (dir !== null) setTreeBro(treeDrag.get(), idx, dir);
    treeDrag.set(new Set());
    setDir(null);
  };

  /** 드래그 입력에서 벗어남 */
  const onLeave = () => setDir(null);

  /** drag 중 드래그 입력 감지 */
  const onMove = (e: PE) => {
    e.preventDefault();
    if (!ref.current || treeDrag.get().size <= 0 || treeDrag.get().has(idx))
      return;
    const rect = ref.current.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    if (e.clientY > y) setDir("RIGHT");
    else setDir("LEFT");
  };

  /** 선택 후 drag 시작 */
  const onDown = (e: PE) => {
    e.preventDefault();
    const s = selectItem(e, idx);
    if (s.has(idx)) {
      treeDrag.set(s);
      ghost_down(e);
    }
  };

  return (
    <div
      ref={ref}
      className={makeClassName(
        "sbj-tree-item",
        "-ovr",
        selectedSet.has(idx) && "-slc",
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
        {title}
      </div>
    </div>
  );
};

export default SbjTreeItem;
