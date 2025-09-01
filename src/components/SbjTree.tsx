import { useSubjectStore } from "../context/SubjectProvider";
import SbjTreeItem from "./SbjTreeItem";
import SbjTreeTitle from "./SbjTreeTitle";
import { newCourse, type Course, type Subject } from "../types/Subject";

const SbjTree = ({ info }: { info?: Course }) => {
  const { sbjList } = useSubjectStore();
  const pInfo: Course = info ?? {
    ...newCourse({ idx: -1, mom: -1, bro: "A0", isMom: true }),
    ttl: "Subject Tree:",
  };

  return (
    <div className={`sbj-tree`}>
      <SbjTreeTitle info={pInfo} />
      {sbjList
        .filter((s) => s.mom === pInfo.idx)
        .sort((a, b) => (a.bro > b.bro ? 1 : a.bro < b.bro ? -1 : 0))
        .map((s) =>
          s.isMom ? (
            <SbjTree info={s as Course} />
          ) : (
            <SbjTreeItem info={s as Subject} />
          )
        )}
    </div>
  );
};

export default SbjTree;
