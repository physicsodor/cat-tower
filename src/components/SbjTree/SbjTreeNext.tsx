import { useState } from "react";
import { useSubjectStore } from "../../context/useSubjectStore";
import { makeClassName } from "../../utils/makeClassName";

type Props = { idx: number };
type PE = React.PointerEvent<HTMLDivElement>;

const SbjTreeNext = ({ idx }: Props) => {
  const { treeDrag, clearTreeDrag, setTreeBro } = useSubjectStore();
  const [isOn, setIsOn] = useState(false);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (isOn) setTreeBro(idx, "RIGHT");
    clearTreeDrag();
    setIsOn(false);
  };

  const onLeave = () => setIsOn(false);

  const onEnter = (e: PE) => {
    e.preventDefault();
    if (treeDrag.size <= 0) return;
    setIsOn(true);
  };

  return (
    <div
      className={makeClassName("sbj-tree-next", "-ovr", isOn && "-nxt")}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerUp={onUp}
    />
  );
};
export default SbjTreeNext;
