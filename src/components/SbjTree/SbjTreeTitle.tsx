import { useState } from "react";
import { useDragGhost } from "../../hooks/useDragGhost";
import { makeClassName } from "../../utils/makeClassName";
import { useSubjectStore } from "../../context/useSubjectStore";
import type { BroDir } from "../../utils/familyOp";

type Props = {
  idx: number;
  ttl: string;
  isOpen: boolean;
  onToggle: () => void;
};
type PE = React.PointerEvent<HTMLDivElement>;

const SbjTreeTitle = ({ idx, ttl, isOpen, onToggle }: Props) => {
  const { setTreeDrag, getTreeDrag, delCrs, setTreeBro, setTreeMom } =
    useSubjectStore();
  const { down, ref } = useDragGhost<HTMLDivElement>();
  const [dir, setDir] = useState<BroDir | null>(null);

  const onUp = (e: PE) => {
    e.preventDefault();
    if (dir === "LEFT") setTreeBro(getTreeDrag(), idx, dir);
    else if (dir === "RIGHT") setTreeMom(getTreeDrag(), idx);
    setTreeDrag(new Set());
    setDir(null);
  };

  const onLeave = () => setDir(null);

  const onMove = (e: PE) => {
    e.preventDefault();
    if (!ref.current || getTreeDrag().size <= 0) return;
    const rect = ref.current.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    if (e.clientY <= y) setDir("LEFT");
    else setDir("RIGHT");
  };

  const onDown = (e: PE) => {
    down(e);
    setTreeDrag(new Set([idx]));
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
      {idx >= 0 ? (
        <div onPointerDown={onDown}>
          <button>=</button>
        </div>
      ) : null}
      {/* {idx >= 0 ? ( */}
      <div onPointerMove={onMove} onPointerLeave={onLeave} onPointerUp={onUp}>
        {ttl}
      </div>
      {/* ) : null} */}
      <button onClick={onToggle}>{isOpen ? "-" : "+"}</button>
      {idx >= 0 ? <button onClick={() => delCrs(idx)}>제거</button> : null}
    </div>
  );
};

export default SbjTreeTitle;
