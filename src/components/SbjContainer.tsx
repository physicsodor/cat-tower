import { useCourseStore } from "../context/CourseProvider";
import CourseTree from "./CourseTree";

const SbjContainer = () => {
  const S = useCourseStore();

  return (
    <div>
      <button onClick={S.addSbj}>추가</button>
      <button onClick={S.delSbj}>제거</button>
      <button onClick={S.addCrs}>그룹 추가</button>
      <CourseTree />
      <div>{JSON.stringify([...S.slcSet])}</div>
    </div>
  );
};

export default SbjContainer;
