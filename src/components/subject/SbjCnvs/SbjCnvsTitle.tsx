import { useMemo } from "react";
import { renderMarkup } from "@/components/TextEditor";
import { useSbjData } from "@/store/SbjDataContext";
import { useSbjSelect } from "@/store/SbjSelectContext";
import { useInfiniteCanvas } from "infinite-canvas";
import { getLabelParts } from "@/lib/Species/speciesOp";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx: number; title: string };

const SbjCnvsTitle = ({ idx, title }: Props) => {
  const { cnvsDrag, idx2sbj, idx2family, idx2spc } = useSbjData();
  const { selectItem } = useSbjSelect();
  const { startItemDrag } = useInfiniteCanvas();

  const labelParts = useMemo(
    () => getLabelParts(idx, idx2spc, idx2sbj, idx2family),
    [idx, idx2spc, idx2sbj, idx2family],
  );

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
      {labelParts && (
        <span className="sbj-cnvs-item-spc-label">
          {labelParts.prefix && <span className="spc-prefix">{labelParts.prefix}</span>}
          {labelParts.num && <span className="spc-num">{labelParts.num}</span>}
        </span>
      )}
      {renderMarkup(title)}
    </div>
  );
};

export default SbjCnvsTitle;
