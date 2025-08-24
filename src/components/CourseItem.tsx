import { useCourseStore } from "../context/CourseProvider";
import { useDragGhost } from "../hooks/useDragGhost";
import { type Course } from "../types/Course";
import SubjectItem from "./SubjectItem";

const CourseItem = ({ info }: { info?: Course }) => {
  const { addCrsDrg, crsList, delCrs, sbjList, setCrsMom } = useCourseStore();
  const { ref, down } = useDragGhost<HTMLDivElement>();
  const idx = info ? info.idx : -1;

  const onUp = () => setCrsMom(idx);
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    down(e);
    addCrsDrg(idx);
  };

  return (
    <div className="course-item">
      {info ? (
        <div
          ref={ref}
          className="title"
          onPointerDown={onDown}
          onPointerUp={onUp}
        >
          <button>+</button>
          {info.ttl}
          <button onClick={delCrs(idx)}>del</button>
        </div>
      ) : null}
      <div className="contents">
        {crsList
          .filter((crs) => crs.mom === idx)
          .map((crs) => (
            <CourseItem key={`crs-${crs.idx}`} info={crs} />
          ))}
        {sbjList
          .filter((sbj) => sbj.mom === idx)
          .map((sbj) => (
            <SubjectItem key={`sbj-${sbj.idx}`} info={sbj} />
          ))}
      </div>
    </div>
  );
};

export default CourseItem;
