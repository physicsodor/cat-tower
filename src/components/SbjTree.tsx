import type { JSX } from "react";
import { useSubjectStore } from "../context/SubjectProvider";
import SbjTreeItem from "./SbjTreeItem";
import SbjTreeTitle from "./SbjTreeTitle";
import { newCourse, type Course, type Subject } from "../types/Subject";

const SbjTree = ({ info }: { info?: Course }) => {
  const { sbjList } = useSubjectStore();
  const pInfo: Course = info ?? {
    ...newCourse({ idx: -1, mom: -1, bro: -1, isMom: true }),
    ttl: "Subject Tree:",
  };
  const broList = sbjList.filter((sbj) => sbj.mom === pInfo.idx);

  const MakeContents = (bro: number): JSX.Element | null => {
    const trg = broList.find((sbj) => sbj.bro === bro);
    if (!trg) return null;
    return (
      <>
        {trg.isMom ? (
          <SbjTree info={trg as Course} />
        ) : (
          <SbjTreeItem info={trg as Subject} />
        )}
        {MakeContents(trg.idx)}
      </>
    );
  };

  return (
    <div className={`sbj-tree`}>
      <SbjTreeTitle info={pInfo} />
      <div className="sbj-tree-contents">{MakeContents(-1)}</div>
    </div>
  );
};

export default SbjTree;
