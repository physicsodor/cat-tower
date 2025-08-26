import { useSubjectStore } from "../context/SubjectProvider";
import type { SelectMode } from "../types/SelectMode";
import type { Subject } from "../types/Subject";
import { useDragGhost } from "../hooks/useDragGhost";
import { useRef } from "react";

const SbjTreeItem = ({ info }: { info: Subject }) => {
  const { slcSet, selectSbj } = useSubjectStore();
  const { ref, down } = useDragGhost<HTMLDivElement>();
  const modeRef = useRef<SelectMode>("NONE");

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    modeRef.current = "REPLACE";
    if (e.ctrlKey) modeRef.current = "ADD";
    else if (e.shiftKey) modeRef.current = "REMOVE";
    else if (slcSet.has(info.idx)) modeRef.current = "NONE";
    selectSbj(modeRef.current, info.idx);
    if (modeRef.current !== "REMOVE") down(e);
  };

  return (
    <div
      ref={ref}
      className={`sbj-tree-item${slcSet.has(info.idx) ? " selected" : ""}`}
      onPointerDown={onDown}
    >
      {info.idx < 0 ? "Subject Tree:" : info.ttl}
    </div>
  );
};

export default SbjTreeItem;
