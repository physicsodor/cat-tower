import { useSubjectStore } from "../context/SubjectProvider";
import SbjTree from "./SbjTree";

const SubjectContainer = () => {
  const { addSbj, deleteSbj } = useSubjectStore();

  return (
    <div>
      <button onClick={addSbj(false)}>추가</button>
      <button onClick={deleteSbj}>제거</button>
      <button onClick={addSbj(true)}>그룹 추가</button>
      <SbjTree />
    </div>
  );
};

export default SubjectContainer;
