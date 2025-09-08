import { useSubjectStore } from "../../context/SubjectProvider";
import type { Subject } from "../../types/Curriculum";
import { makeClassName } from "../../utils/makeClassName";

type PE = React.PointerEvent<HTMLDivElement>;

const SbjCnvsItem = ({
  info,
  dxy,
  isSelected,
  setPxy,
}: {
  info: Subject;
  dxy: { x: number; y: number };
  isSelected: boolean;
  setPxy: (e: PE) => void;
}) => {
  const { setSelMode, selCnvsSbjDrag, selSbj } = useSubjectStore();

  const onDown = (e: PE) => {
    const mode = setSelMode(e, info.idx);
    selSbj(mode, info.idx);
    if (mode !== "REMOVE") {
      selCnvsSbjDrag(true);
      setPxy(e);
    }
  };

  return (
    <div
      className={makeClassName("sbj-cnvs-item", isSelected && "selected")}
      style={{
        transform: `translate(${info.x + dxy.x}px, ${info.y + dxy.y}px)`,
      }}
      onPointerDown={onDown}
    >
      {info.ttl}
      {dxy.x}
      {dxy.y}
    </div>
  );
};

export default SbjCnvsItem;
