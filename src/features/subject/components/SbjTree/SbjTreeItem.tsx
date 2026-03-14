import { useDragGhost } from "@/hooks/useDragGhost";
import React, { useEffect, useRef, useState } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/features/subject/types/Family/familyOp";
import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSelect } from "../../context/SbjSelectContext";
import { treeRegistry, findDropTarget, clearAllDirs } from "./treeRegistry";
import BttnEdt from "@/components/Bttn/BttnEdt";
import BttnDel from "@/components/Bttn/BttnDel";
import { renderMarkup } from "@/components/TextEditor";

type Props = { idx: number; title: string };

const SbjTreeItem = ({ idx, title }: Props) => {
  const { treeDrag, setTreeBro, openEdit, delSbjOne } = useSbjData();
  const { selectedSet, selectItem } = useSbjSelect();
  const { ref, down: ghost_down } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);
  const globalMoveRef = useRef<((e: PointerEvent) => void) | null>(null);

  useEffect(() => {
    if (ref.current)
      treeRegistry.set(idx, {
        el: ref.current,
        setDir,
        onDrop: (dragged, d) => setTreeBro(dragged, idx, d),
      });
    return () => {
      treeRegistry.delete(idx);
    };
  }, [idx, ref, setTreeBro]);

  const stopDrag = () => {
    if (globalMoveRef.current) {
      document.removeEventListener("pointermove", globalMoveRef.current);
      globalMoveRef.current = null;
    }
    clearAllDirs();
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const s = selectItem(e, idx);
    if (!s.has(idx)) return;
    treeDrag.set(s);
    ghost_down(e);

    let prevTargetIdx: number | null = null;
    const handler = (ev: PointerEvent) => {
      const target = findDropTarget(ev.clientX, ev.clientY, idx);
      if (prevTargetIdx !== null && prevTargetIdx !== target?.idx)
        treeRegistry.get(prevTargetIdx)?.setDir(null);
      if (target) {
        treeRegistry.get(target.idx)?.setDir(target.dir);
        prevTargetIdx = target.idx;
      } else {
        prevTargetIdx = null;
      }
    };
    globalMoveRef.current = handler;
    document.addEventListener("pointermove", handler);
  };

  const onUp = (e: React.PointerEvent) => {
    e.preventDefault();
    const target = findDropTarget(e.clientX, e.clientY, idx);
    if (target)
      treeRegistry.get(target.idx)?.onDrop(treeDrag.get(), target.dir);
    treeDrag.set(new Set());
    setDir(null);
    stopDrag();
  };

  const onCancel = () => {
    treeDrag.set(new Set());
    setDir(null);
    stopDrag();
  };

  return (
    <div
      ref={ref}
      className={makeClassName(
        "sbj-tree-item",
        "-ovr",
        selectedSet.has(idx) && "-slc",
        dir === "LEFT" && "-pre",
        dir === "RIGHT" && "-nxt",
      )}
    >
      <div
        style={{ touchAction: "none", flex: 1 }}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        {renderMarkup(title)}
      </div>
      <BttnEdt
        onDown={(e) => {
          e.stopPropagation();
          openEdit(idx);
        }}
      />
      <BttnDel
        onDown={(e) => {
          e.stopPropagation();
          delSbjOne(idx);
        }}
      />
    </div>
  );
};

export default SbjTreeItem;
