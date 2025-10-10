import { useState } from "react";
import { useSubjectStore } from "../../context/useSubjectStore";
import { makeClassName } from "../../utils/makeClassName";

type Props = { idx: number };
type PE = React.PointerEvent<HTMLDivElement>;

const SbjTreeNext = ({ idx }: Props) => {
  const { getTreeDrag, setTreeDrag, setTreeBro } = useSubjectStore();
  const [isOn, setIsOn] = useState(false);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (isOn) setTreeBro(getTreeDrag(), idx, "RIGHT");
    setTreeDrag(new Set());
    setIsOn(false);
  };

  const onLeave = () => setIsOn(false);

  const onEnter = (e: PE) => {
    e.preventDefault();
    if (getTreeDrag().size <= 0) return;
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
