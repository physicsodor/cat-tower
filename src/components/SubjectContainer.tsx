import { useCurriculumStore } from "../context/useCurriculumStore";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjTree from "./SbjTree/SbjTree";

const SubjectContainer = () => {
  const { sbjList, addCrs, addSbj, delSbj } = useCurriculumStore();

  return (
    <div>
      <button onClick={addSbj}>추가</button>
      <button onClick={delSbj}>제거</button>
      <button onClick={addCrs}>그룹 추가</button>
      <SbjTree />
      <div>{JSON.stringify(sbjList)}</div>
      <SbjCnvs />
    </div>
  );
};

export default SubjectContainer;
