import { useDragGhost } from "@/hooks/useDragGhost";
import React, { useEffect, useRef, useState } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/features/subject/types/Family/familyOp";
import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSelect } from "../../context/SbjSelectContext";

type Props = { idx: number; title: string };

/**
 * 각 SbjTreeItem이 자신의 DOM 요소와 setDir을 등록하는 레지스트리.
 * elementFromPoint 기반 drop target 감지에 사용된다.
 */
const itemRegistry = new Map<
  number,
  { el: HTMLDivElement; setDir: (d: BroDir | null) => void }
>();

const SbjTreeItem = ({ idx, title }: Props) => {
  const { treeDrag, setTreeBro } = useSbjData();
  const { selectedSet, selectItem } = useSbjSelect();
  const { ref, down: ghost_down } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);
  const globalMoveRef = useRef<((e: PointerEvent) => void) | null>(null);

  // mount/unmount 시 레지스트리 등록/해제
  useEffect(() => {
    if (ref.current) itemRegistry.set(idx, { el: ref.current, setDir });
    return () => { itemRegistry.delete(idx); };
  });

  const stopDrag = () => {
    if (globalMoveRef.current) {
      document.removeEventListener("pointermove", globalMoveRef.current);
      globalMoveRef.current = null;
    }
    for (const [, { setDir: sd }] of itemRegistry) sd(null);
  };

  /** drop target을 clientX/Y로 찾아 반환 */
  const findTarget = (x: number, y: number): { tIdx: number; dir: BroDir } | null => {
    const el = document.elementFromPoint(x, y);
    for (const [tIdx, { el: tEl }] of itemRegistry) {
      if (tIdx !== idx && tEl.contains(el)) {
        const rect = tEl.getBoundingClientRect();
        return { tIdx, dir: y > rect.top + rect.height / 2 ? "RIGHT" : "LEFT" };
      }
    }
    return null;
  };

  /** drag 시작 */
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const s = selectItem(e, idx);
    if (!s.has(idx)) return;
    treeDrag.set(s);
    ghost_down(e);

    // 전역 pointermove: elementFromPoint로 drop target 시각적 업데이트
    let prevTargetIdx: number | null = null;
    const handler = (ev: PointerEvent) => {
      const target = findTarget(ev.clientX, ev.clientY);
      if (prevTargetIdx !== null && prevTargetIdx !== target?.tIdx) {
        itemRegistry.get(prevTargetIdx)?.setDir(null);
      }
      if (target) {
        itemRegistry.get(target.tIdx)?.setDir(target.dir);
        prevTargetIdx = target.tIdx;
      } else {
        prevTargetIdx = null;
      }
    };
    globalMoveRef.current = handler;
    document.addEventListener("pointermove", handler);
  };

  /** drop */
  const onUp = (e: React.PointerEvent) => {
    e.preventDefault();
    const target = findTarget(e.clientX, e.clientY);
    if (target) setTreeBro(treeDrag.get(), target.tIdx, target.dir);
    treeDrag.set(new Set());
    setDir(null);
    stopDrag();
  };

  /** 취소 */
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
        dir === "RIGHT" && "-nxt"
      )}
    >
      <div
        style={{ touchAction: "none" }}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        {title}
      </div>
    </div>
  );
};

export default SbjTreeItem;
