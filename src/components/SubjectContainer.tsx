import { useCourseStore } from "../context/CourseProvider";
import CourseItem from "./CourseItem";

const SubjectContainer = () => {
  const S = useCourseStore();

  return (
    <div>
      <button onClick={S.addSbj}>추가</button>
      <button onClick={S.delSbj}>제거</button>
      <button onClick={S.addCrs}>그룹 추가</button>
      <CourseItem />
      <div>{JSON.stringify([...S.crsList])}</div>
    </div>
  );
};

export default SubjectContainer;
