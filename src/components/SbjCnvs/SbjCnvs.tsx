import { useSubjectStore } from "../../context/SubjectProvider";
import type { Subject } from "../../types/Curriculum";
import SbjCnvsItem from "./SbjCnvsItem";

const SbjCnvs = () => {
  const { sbjList } = useSubjectStore();

  return (
    <div className="sbj-cnvs">
      {sbjList.map((s) =>
        s.isMom ? null : <SbjCnvsItem info={s as Subject} />
      )}
    </div>
  );
};

export default SbjCnvs;
