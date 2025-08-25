import { useSubjectStore } from "../context/SubjectProvider";
import { type Course } from "../types/Course";
import type { Subject } from "../types/Subject";
import SbjTreeItem from "./SbjTreeItem";

const SbjTree = ({ info }: { info?: Course | Subject }) => {
  const { sbjList } = useSubjectStore();
  const idx = info?.idx ?? -1;

  return (
    <div className="sbj-tree">
      {info ? <SbjTreeItem info={info} /> : null}
      {sbjList
        .filter((sbj) => sbj.mom === idx)
        .map((sbj) =>
          "Course" in sbj ? (
            <SbjTree key={`crs-${sbj.idx}`} info={sbj} />
          ) : (
            <SbjTreeItem key={`sbj-${sbj.idx}`} info={sbj} />
          )
        )}
    </div>
  );
};

export default SbjTree;
