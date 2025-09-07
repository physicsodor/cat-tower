import { useSubjectStore } from "../context/SubjectProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjTree from "./SbjTree/SbjTree";

const SubjectContainer = () => {
  const { addCrs, addSbj, delSbj } = useSubjectStore();

  return (
    <div>
      <button onClick={addSbj}>추가</button>
      <button onClick={delSbj}>제거</button>
      <button onClick={addCrs}>그룹 추가</button>
      <SbjTree />
      <SbjCnvs />
    </div>
  );
};

export default SubjectContainer;
