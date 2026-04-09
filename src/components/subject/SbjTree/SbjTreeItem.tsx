import { useDragGhost } from "@/hooks/useDragGhost";
import React, { useEffect, useRef, useState } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/lib/Family/family";
import { useSbjData } from "@/store/SbjDataContext";
import { useSbjSelect } from "@/store/SbjSelectContext";
import { treeRegistry, findDropTarget, clearAllDirs } from "./treeRegistry";
import { BttnEdt, BttnDel } from "button-bundle";
import { renderMarkup } from "@/components/TextEditor";

type Props = { idx: number; title: string; numPrefix?: string };

const SbjTreeItem = ({ idx, title, numPrefix }: Props) => {
  const { treeDrag, setTreeBro, openEdit, delSbjOne } = useSbjData();
  const { selectedSet, selectItem } = useSbjSelect();
  const { ref, down: ghost_down } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);
  const globalMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const hasMoved = useRef(false);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const lastUpTime = useRef(0);

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
    hasMoved.current = false;
    downPos.current = { x: e.clientX, y: e.clientY };
    const s = selectItem(e, idx);
    if (!s.has(idx)) return;
    treeDrag.set(s);
    ghost_down(e);

    let prevTargetIdx: number | null = null;
    const handler = (ev: PointerEvent) => {
      if (downPos.current) {
        const dx = ev.clientX - downPos.current.x;
        const dy = ev.clientY - downPos.current.y;
        if (Math.hypot(dx, dy) > 8) hasMoved.current = true;
      }
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

    if (!hasMoved.current) {
      const now = Date.now();
      if (now - lastUpTime.current < 300) {
        openEdit(idx);
        lastUpTime.current = 0;
      } else {
        lastUpTime.current = now;
      }
    }
    downPos.current = null;
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
        style={{ touchAction: "none" }}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        {numPrefix && <span className="sbj-tree-num">{numPrefix}.</span>}
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
