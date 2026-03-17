import { useSbjData } from "../../store/SbjDataContext";
import SbjCnvsCrs from "./SbjCnvsCrs";
import type { BBox } from "../../model/rect";

type Props = {
  bboxMap: ReadonlyMap<number, BBox>;
  items: Map<number, HTMLDivElement | null>;
  back?: boolean;
};

const SbjCnvsCrsContainer = ({ bboxMap, items, back = false }: Props) => {
  const { idx2family, idx2sbj } = useSbjData();
  return (
    <div>
      {[...idx2family].map(([idx, f]) => {
        if (!f.kids) return null;
        const bbox = bboxMap.get(idx);
        if (!bbox) return null;
        const s = idx2sbj.get(idx);
        const label = s ? (s.short || s.title) : "";
        return (
          <SbjCnvsCrs
            key={`sbj-cnvs-crs-${idx}`}
            setRef={(x) => {
              if (x) items.set(idx, x);
              else items.delete(idx);
            }}
            {...{ idx, bbox, label, back }}
          />
        );
      })}
    </div>
  );
};

export default SbjCnvsCrsContainer;
