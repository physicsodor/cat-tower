import { renderMarkup } from "@/components/TextEditor";
import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSelect } from "../../context/SbjSelectContext";
import { useInfiniteCanvas } from "@/components/InfiniteCanvas";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx: number; title: string };

const SbjCnvsTitle = ({ idx, title }: Props) => {
  const { cnvsDrag } = useSbjData();
  const { selectItem } = useSbjSelect();
  const { startItemDrag } = useInfiniteCanvas();
  const onDown = (e: PE) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const s = selectItem(e, idx);
    if (s.has(idx)) {
      cnvsDrag.set(s);
      startItemDrag(e.clientX, e.clientY);
    }
  };

  return (
    <div className="sbj-cnvs-item-ttl" onPointerDown={onDown}>
      {renderMarkup(title)}
    </div>
  );
};

export default SbjCnvsTitle;
