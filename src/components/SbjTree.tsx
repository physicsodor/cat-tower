import { useState } from "react";
import { useSubjectStore } from "../context/SubjectProvider";
import { DefCrs, type Course } from "../types/Course";
import type { Subject } from "../types/Subject";
import SbjTreeItem from "./SbjTreeItem";

const SbjTree = ({ info }: { info?: Course | Subject }) => {
  const { sbjList } = useSubjectStore();
  const [isOpen, setIsOpen] = useState(true);
  const idx = info?.idx ?? -1;
  const flipOpen = () => setIsOpen((b) => !b);
  const childrenList = sbjList.filter((sbj) => sbj.mom === idx);

  return (
    <div className={`sbj-tree`}>
      <div className="sbj-tree-title">
        <SbjTreeItem info={info ?? DefCrs(-1, -1)} />
        {childrenList.length > 0 ? (
          <button onClick={flipOpen}>{isOpen ? "-" : "+"}</button>
        ) : null}
      </div>
      <div className={`sbj-tree-contents${isOpen ? "" : " hidden"}`}>
        {childrenList.map((sbj) =>
          "Course" in sbj ? (
            <SbjTree key={`crs-${sbj.idx}`} info={sbj} />
          ) : (
            <SbjTreeItem key={`sbj-${sbj.idx}`} info={sbj} />
          )
        )}
      </div>
    </div>
  );
};

export default SbjTree;
