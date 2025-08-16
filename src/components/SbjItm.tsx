import { useCourseStore } from "../context/CourseProvider";
import type { SelectMode } from "../types/SelectMode";
import type { Subject } from "../types/Subject";

const SbjItm = ({ info }: { info: Subject }) => {
  const S = useCourseStore();

  const handle_onClick =
    (idx: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      let mode: SelectMode = "REPLACE";
      if (e.ctrlKey) mode = "ADD";
      else if (e.shiftKey) mode = "REMOVE";
      else if (S.slcSet.has(idx)) mode = "NONE";
      S.select(mode, idx);
    };

  return (
    <div
      className={`sbj-itm${S.slcSet.has(info.idx) ? " slc" : ""}`}
      onClick={handle_onClick(info.idx)}
    >
      {info.ttl}
    </div>
  );
};

export default SbjItm;
