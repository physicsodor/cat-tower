import { useSubjectStore } from "../../context/useSubjectStore";
import type { Subject } from "../../types/Curriculum";
import { makeClassName } from "../../utils/makeClassName";
import SbjCnvsTitle from "./SbjCnvsTitle";

type Props = {
  info: Subject;
  dxy: { dx: number; dy: number };
  isSelected: boolean;
};

const SbjCnvsItem = ({ info, dxy: { dx, dy }, isSelected }: Props) => {
  return (
    <div
      className={makeClassName("sbj-cnvs-item", isSelected && "-slc")}
      style={{
        transform: `translate(${info.x + dx}px, ${info.y + dy}px)`,
      }}
    >
      <div className="in"></div>
      <SbjCnvsTitle idx={info.idx} ttl={info.ttl} />
      <div className="out"></div>
    </div>
  );
};

export default SbjCnvsItem;
