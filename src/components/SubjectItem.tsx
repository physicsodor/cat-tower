import { useState } from "react";
import { useCourseStore } from "../context/CourseProvider";
import type { SelectMode } from "../types/SelectMode";
import type { Subject } from "../types/Subject";

const SubjectItem = ({ info }: { info: Subject }) => {
  const [dxy, setDxy] = useState([0, 0]);
  const { slcSet, slcSbj } = useCourseStore();

  const handle_onMouseDown =
    (idx: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();

      let mode: SelectMode = "REPLACE";
      if (e.ctrlKey) mode = "ADD";
      else if (e.shiftKey) mode = "REMOVE";
      else if (slcSet.has(idx)) mode = "NONE";
      slcSbj(mode, idx);

      const pxy = [e.clientX, e.clientY];

      document.addEventListener("mousemove", _docMouseMove);
      document.addEventListener("mouseup", _docMouseUp);
      function _docMouseMove(e: MouseEvent) {
        setDxy([e.clientX - pxy[0], e.clientY - pxy[1]]);
      }
      function _docMouseUp() {
        setDxy([0, 0]);
        document.removeEventListener("mousemove", _docMouseMove);
        document.removeEventListener("mouseup", _docMouseUp);
      }
    };

  return (
    <div
      className={`subject-item${slcSet.has(info.idx) ? " selected" : ""}`}
      onMouseDown={handle_onMouseDown(info.idx)}
      style={{ transform: `translate(${dxy[0]}px, ${dxy[1]}px)` }}
    >
      {info.ttl}
    </div>
  );
};

export default SubjectItem;
