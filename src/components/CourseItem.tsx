import { useCourseStore } from "../context/CourseProvider";
import { type Course } from "../types/Course";
import SubjectItem from "./SubjectItem";

const CourseItem = ({ info }: { info?: Course }) => {
  const { sbjList, crsList, delCrs } = useCourseStore();
  const idx = info ? info.idx : -1;

  return (
    <div className="course-item">
      {info ? (
        <div className="title">
          <button>+</button>
          {info.ttl}
          <button onClick={delCrs(idx)}>del</button>
        </div>
      ) : null}
      <div className="contents">
        {crsList
          .filter((crs) => crs.mom === idx)
          .map((crs) => (
            <CourseItem info={crs} />
          ))}
        {sbjList
          .filter((sbj) => sbj.mom === idx)
          .map((sbj) => (
            <SubjectItem info={sbj} />
          ))}
      </div>
    </div>
  );
};

export default CourseItem;
