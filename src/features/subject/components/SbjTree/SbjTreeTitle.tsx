import { useState } from "react";
import { useDragGhost } from "@/hooks/useDragGhost";
import { makeClassName } from "@/utils/makeClassName";
import type { BroDir } from "@/features/subject/types/Family/familyOp";
import BttnPM from "@/components/Bttn/BttnPM";
import BttnDel from "@/components/Bttn/BttnDel";
import BttnChk from "@/components/Bttn/BttnChk";
import { useSbjData } from "@/features/subject/context/SbjDataContext";
import { useSbjSelect } from "@/features/subject/context/SbjSelectContext";

type Props = {
  idx: number;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
};
type PE = React.PointerEvent | PointerEvent;

const SbjTreeTitle = ({ idx, title, isOpen, onToggle }: Props) => {
  const { delCrs, treeDrag, setTreeBro, setTreeMom, idx2sbj, idx2family } = useSbjData();
  const { selectMany } = useSbjSelect();
  const { down, ref } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);

  const onSelectDescendants = () => {
    const result = new Set<number>();
    const traverse = (i: number) => {
      for (const kid of idx2family.get(i)?.kids ?? []) {
        if (idx2sbj.get(kid)?.sbjType === "SUBJECT") result.add(kid);
        traverse(kid);
      }
    };
    traverse(idx);
    selectMany(result);
  };

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
      <div
        onPointerDown={idx >= 0 ? onDown : undefined}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerUp={onUp}
      >
        {title}
      </div>
      {idx >= 0 ? <BttnChk onDown={onSelectDescendants} /> : null}
      {idx >= 0 ? <BttnPM isPlus={!isOpen} onDown={onToggle} /> : null}
      {idx >= 0 && isOpen ? <BttnDel onDown={() => delCrs(idx)} /> : null}
    </div>
  );
};

export default SbjTreeTitle;
