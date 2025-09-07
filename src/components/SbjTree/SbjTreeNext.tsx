import { useState } from "react";
import { useSubjectStore } from "../../context/SubjectProvider";
import type { Course } from "../../types/Curriculum";

type PE = React.PointerEvent<HTMLDivElement>;

const SbjTreeNext = ({ info }: { info: Course }) => {
  const { isDrag, clearDrag, setSbjBro } = useSubjectStore();
  const [isOn, setIsOn] = useState(false);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (isOn) setSbjBro(info.idx, "NEXT");
    clearDrag();
    setIsOn(false);
  };

  const onLeave = () => setIsOn(false);

  const onNextEnter = (e: PE) => {
    e.preventDefault();
    if (!isDrag) return;
    setIsOn(true);
  };

  return (
    <div
      className={`sbj-tree-next sbj-tree-up${isOn ? " nxt" : ""}`}
      onPointerEnter={onNextEnter}
      onPointerLeave={onLeave}
      onPointerUp={onUp}
    />
  );
};
export default SbjTreeNext;
