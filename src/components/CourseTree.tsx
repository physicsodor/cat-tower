import { useCourseStore } from "../context/CourseProvider";
import CrsItm from "./CrsItm";
import SbjItm from "./SbjItm";

const CourseTree = () => {
  const S = useCourseStore();

  const makeCourse = (i: number) => (
    <div>
      {i < 0 ? null : <CrsItm info={S.crsList[i]} />}
      {S.crsList
        .filter((crs) => crs.mom === i)
        .map((crs) => makeCourse(crs.idx))}
      {S.sbjList
        .filter((sbj) => sbj.mom === i)
        .map((sbj) => (
          <SbjItm info={sbj} />
        ))}
    </div>
  );

  return makeCourse(-1);
};

export default CourseTree;
