import { useSubjectStore } from "../context/SubjectProvider";
import SbjTree from "./SbjTree";

const SubjectContainer = () => {
  const { sbjList, addCrs, addSbj, deleteSbj } = useSubjectStore();

  return (
    <div>
      <button onClick={addSbj}>추가</button>
      <button onClick={deleteSbj}>제거</button>
      <button onClick={addCrs}>그룹 추가</button>
      <SbjTree />
      {sbjList.map((sbj) => (
        <div>{JSON.stringify(sbj)}</div>
      ))}
    </div>
  );
};

export default SubjectContainer;
