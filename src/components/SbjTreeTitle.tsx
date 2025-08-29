import { useSubjectStore } from "../context/SubjectProvider";
import { useDragGhost } from "../hooks/useDragGhost";
import type { Course } from "../types/Subject";

const SbjTreeTitle = ({ info }: { info: Course }) => {
  const { crsDrag, delCrs, selCrsDrag, setCrsMom, setSbjMom } =
    useSubjectStore();
  const { ref, down } = useDragGhost<HTMLDivElement>();

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    down(e);
    selCrsDrag(info.idx);
  };

  const onUp = () => {
    if (crsDrag < 0) setSbjMom(info.idx);
    else {
      if (crsDrag < 0) return;
      setCrsMom(info.idx);
      selCrsDrag(-1);
    }
  };

  return (
    <div ref={ref} className="sbj-tree-title" onPointerUp={onUp}>
      <div onPointerDown={onDown}>
        <button>=</button>
      </div>
      <div>{info.ttl}</div>
      <button>+</button>
      <button onClick={delCrs(info.idx)}>제거</button>
    </div>
  );
};

export default SbjTreeTitle;
