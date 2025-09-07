import type { Subject } from "../../types/Curriculum";

const SbjCnvsItem = ({ info }: { info: Subject }) => {
  return <div className="SbjCnvsItem">{info.ttl}</div>;
};

export default SbjCnvsItem;
