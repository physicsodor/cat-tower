import { useState } from "react";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjStore } from "../../context/SbjContext";

type Props = { idx: number };
type PE = React.PointerEvent<HTMLDivElement>;

const SbjTreeNext = ({ idx }: Props) => {
  const { treeDrag, setTreeBro } = useSbjStore();
  const [isOn, setIsOn] = useState(false);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (isOn) setTreeBro(treeDrag.get(), idx, "RIGHT");
    treeDrag.set(new Set());
    setIsOn(false);
  };

  const onLeave = () => setIsOn(false);

  const onEnter = (e: PE) => {
    e.preventDefault();
    if (treeDrag.get().size <= 0) return;
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
