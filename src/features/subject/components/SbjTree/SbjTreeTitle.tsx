import { useState } from "react";
import { useDragGhost } from "@/hooks/useDragGhost";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/features/subject/types/Family/familyOp";
import BttnVert from "@/components/Bttn/BttnVert";
import BttnPM from "@/components/Bttn/BttnPM";
import BttnDel from "@/components/Bttn/BttnDel";
import { useSbjData } from "@/features/subject/context/SbjDataContext";

type Props = {
  idx: number;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
};
type PE = React.PointerEvent | PointerEvent;

const SbjTreeTitle = ({ idx, title, isOpen, onToggle }: Props) => {
  const { delCrs, treeDrag, setTreeBro, setTreeMom } = useSbjData();
  const { down, ref } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (dir === "LEFT") setTreeBro(treeDrag.get(), idx, dir);
    else if (dir === "RIGHT") setTreeMom(treeDrag.get(), idx);
    treeDrag.set(new Set());
    setDir(null);
  };

  const onLeave = () => setDir(null);

  const onMove = (e: PE) => {
    e.preventDefault();
    if (!ref.current || treeDrag.get().size <= 0) return;
    const rect = ref.current.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    if (e.clientY <= y) setDir("LEFT");
    else setDir("RIGHT");
  };

  const onDown = (e: PE) => {
    e.preventDefault();
    down(e);
    treeDrag.set(new Set([idx]));
  };

  return (
    <div
      ref={ref}
      className={makeClassName(
        "sbj-tree-title",
        "-ovr",
        dir === "LEFT" && "-pre",
        dir === "RIGHT" && "-nxt"
      )}
    >
      {idx >= 0 ? <BttnVert onDown={onDown} /> : null}
      <div onPointerMove={onMove} onPointerLeave={onLeave} onPointerUp={onUp}>
        {title}
      </div>
      <BttnPM isPlus={!isOpen} onDown={onToggle} />
      {idx >= 0 && isOpen ? <BttnDel onDown={() => delCrs(idx)} /> : null}
    </div>
  );
};

export default SbjTreeTitle;
