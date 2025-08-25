import { useSubjectStore } from "../context/SubjectProvider";
import type { SelectMode } from "../types/SelectMode";
import type { Subject } from "../types/Subject";
import { useDragGhost } from "../hooks/useDragGhost";
import type { Course } from "../types/Course";

const SbjTreeItem = ({ info }: { info: Course | Subject }) => {
  const { slcSet, selectSbj, setSbjMom } = useSubjectStore();
  const { ref, down } = useDragGhost<HTMLDivElement>();

  const onUp =
    (idx: number, isCourse: boolean) =>
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!isCourse) return;
      setSbjMom(idx);
    };

  const onDown = (idx: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    let mode: SelectMode = "REPLACE";
    if (e.ctrlKey) mode = "ADD";
    else if (e.shiftKey) mode = "REMOVE";
    else if (slcSet.has(idx)) mode = "NONE";
    selectSbj(mode, idx);

    down(e);
  };

  return (
    <div
      ref={ref}
      className={`sbj-tree-item${slcSet.has(info.idx) ? " selected" : ""}`}
      onPointerDown={onDown(info.idx)}
      onPointerUp={onUp(info.idx, "Course" in info)}
    >
      {info.ttl}
    </div>
  );
};

export default SbjTreeItem;
