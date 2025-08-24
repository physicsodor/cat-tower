import { useCourseStore } from "../context/CourseProvider";
import CourseItem from "./CourseItem";

const SubjectContainer = () => {
  const { addCrs, addSbj, crsList, delSbj } = useCourseStore();

  return (
    <div>
      <button onClick={addSbj}>추가</button>
      <button onClick={delSbj}>제거</button>
      <button onClick={addCrs}>그룹 추가</button>
      <CourseItem />
      <div>{JSON.stringify([...crsList])}</div>
    </div>
  );
};

export default SubjectContainer;
