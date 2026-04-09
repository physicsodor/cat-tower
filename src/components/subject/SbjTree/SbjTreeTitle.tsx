import { useEffect, useRef, useState } from "react";
import React from "react";
import { useDragGhost } from "@/hooks/useDragGhost";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/lib/Family/family";
import { BttnPM, BttnDel, BttnChk, BttnEdt } from "button-bundle";
import { useSbjData } from "@/store/SbjDataContext";
import { useSbjSelect } from "@/store/SbjSelectContext";
import { treeRegistry, findDropTarget, clearAllDirs } from "./treeRegistry";
import { renderMarkup } from "@/components/TextEditor";

type Props = {
  idx: number;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  numPrefix?: string;
};

const SbjTreeTitle = ({ idx, title, isOpen, onToggle, numPrefix }: Props) => {
  const {
    delCrs,
    treeDrag,
    setTreeBro,
    setTreeMom,
    idx2sbj,
    idx2family,
    openEdit,
  } = useSbjData();
  const { selectMany } = useSbjSelect();
  const { down, ref } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);
  const globalMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const hasMoved = useRef(false);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const lastUpTime = useRef(0);

  useEffect(() => {
    if (ref.current && idx >= 0)
      treeRegistry.set(idx, {
        el: ref.current,
        setDir,
        onDrop: (dragged, d) => {
          if (d === "LEFT") setTreeBro(dragged, idx, d);
          else setTreeMom(dragged, idx);
        },
      });
    return () => {
      if (idx >= 0) treeRegistry.delete(idx);
    };
  }, [ref, idx, setTreeBro, setTreeMom]);

  const onSelectDescendants = () => {
    const result = new Set<number>();
    const traverse = (i: number) => {
      for (const kid of idx2family.get(i)?.kids ?? []) {
        if (idx2sbj.get(kid)?.sbjType === "SUBJECT") result.add(kid);
        traverse(kid);
      }
    };
    traverse(idx);
    selectMany(result);
  };

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
    down(e);
    treeDrag.set(new Set([idx]));

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

    if (!hasMoved.current && idx >= 0) {
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
        "sbj-tree-title",
        "-ovr",
        dir === "LEFT" && "-pre",
        dir === "RIGHT" && "-nxt",
      )}
    >
      <div
        style={{ touchAction: "none" }}
        onPointerDown={idx >= 0 ? onDown : undefined}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        {numPrefix && idx >= 0 && (
          <span className="sbj-tree-num">{numPrefix}.</span>
        )}
        {renderMarkup(title)}
      </div>
      {idx >= 0 ? <BttnPM isPlus={!isOpen} onDown={onToggle} /> : null}
      <BttnChk onDown={onSelectDescendants} />
      {idx >= 0 ? (
        <BttnEdt
          onDown={(e) => {
            e.stopPropagation();
            openEdit(idx);
          }}
        />
      ) : null}
      {idx >= 0 ? <BttnDel onDown={() => delCrs(idx)} /> : null}
    </div>
  );
};

export default SbjTreeTitle;
