import { useState } from "react";
import { useSubjectStore } from "../context/SubjectProvider";
import { useDragGhost } from "../hooks/useDragGhost";
import type { Course } from "../types/Course";

const SbjTreeTitle = ({ info }: { info: Course }) => {
  const { crsDrag, selectCrsDrag, setCrsMom, setSbjMom } = useSubjectStore();
  const { ref, down } = useDragGhost<HTMLDivElement>();
  const [isWriting, setIsWriting] = useState(false);

  const flipIsWriting = () => setIsWriting((b) => !b);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    down(e);
    selectCrsDrag(info.idx);
  };

  const onUp = () => {
    if (crsDrag < 0) setSbjMom(info.idx);
    else {
      setCrsMom(info.idx);
      selectCrsDrag(-1);
    }
  };

  return (
    <div ref={ref} className="sbj-tree-title" onPointerUp={onUp}>
      <div onPointerDown={onDown}>=</div>
      <div onClick={flipIsWriting} contentEditable={isWriting}>
        {isWriting ? info.ttl : info.ttl}
      </div>
      <button>+</button>
    </div>
  );
};

export default SbjTreeTitle;
