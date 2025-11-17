import { useDragGhost } from "@/hooks/useDragGhost";
import React, { useState } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/features/subject/utils/familyOp";
import { useSbjStore } from "../../context/SbjContext";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx: number; ttl: string };

const SbjTreeItem = ({ idx, ttl }: Props) => {
  const { slcSet, slcSbj, treeDrag, setTreeBro } = useSbjStore();
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
    const s = slcSbj(e, idx);
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
