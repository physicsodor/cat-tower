import type { JSX, ReactElement } from "react";
import { useSubjectStore } from "../context/SubjectProvider";
import { DefCrs, isCourse, type Course } from "../types/Course";
import SbjTreeItem from "./SbjTreeItem";
import SbjTreeTitle from "./SbjTreeTitle";

const SbjTree = ({ info }: { info?: Course }) => {
  const { sbjList } = useSubjectStore();
  const pInfo: Course = info ?? { ...DefCrs(-1), ttl: "Subject Tree:" };
  const broList = sbjList.filter((sbj) => sbj.mom === pInfo.idx);

  const MakeContents = (bro: number): JSX.Element | null => {
    const trg = broList.find((sbj) => sbj.bro === bro);
    if (!trg) return null;
    return (
      <>
        {isCourse(trg) ? <SbjTree info={trg} /> : <SbjTreeItem info={trg} />}
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
