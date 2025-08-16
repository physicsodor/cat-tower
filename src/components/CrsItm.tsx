import type { Course } from "../types/Course";

const CrsItm = ({ info }: { info: Course }) => {
  return (
    <div className="crs-itm">
      <div>접고 펼치기?</div>
      <div>{info.ttl}</div>
      <div>del</div>
    </div>
  );
};

export default CrsItm;
