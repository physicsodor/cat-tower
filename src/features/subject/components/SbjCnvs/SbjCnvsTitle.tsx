import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSelect } from "../../context/SbjSelectContext";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx: number; title: string };

const SbjCnvsTitle = ({ idx, title }: Props) => {
  const { cnvsDragStart, cnvsDrag } = useSbjData();
  const { selectItem } = useSbjSelect();
  const onDown = (e: PE) => {
    e.preventDefault();
    const s = selectItem(e, idx);
    if (s.has(idx)) {
      cnvsDrag.set(s);
      cnvsDragStart.set({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="ttl" onPointerDown={onDown}>
      {title}
    </div>
  );
};

export default SbjCnvsTitle;
