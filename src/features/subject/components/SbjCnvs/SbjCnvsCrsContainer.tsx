import { useSbjData } from "../../context/SbjDataContext";
import SbjCnvsCrs from "./SbjCnvsCrs";

type LRTB = { l: number; r: number; t: number; b: number };
type Props = {
  lrtbMap: ReadonlyMap<number, LRTB>;
  items: Map<number, HTMLDivElement | null>;
  back?: boolean;
};

const SbjCnvsCrsContainer = ({ lrtbMap, items, back = false }: Props) => {
  const { idx2family, idx2sbj } = useSbjData();
  return (
    <div>
      {[...idx2family].map(([idx, f]) => {
        if (!f.kids) return null;
        const lrtb = lrtbMap.get(idx);
        if (!lrtb) return null;
        const s = idx2sbj.get(idx);
        const label = s ? (s.short || s.title) : "";
        return (
          <SbjCnvsCrs
            key={`sbj-cnvs-crs-${idx}`}
            setRef={(x) => {
              if (x) items.set(idx, x);
              else items.delete(idx);
            }}
            {...{ idx, lrtb, label, back }}
          />
        );
      })}
    </div>
  );
};

export default SbjCnvsCrsContainer;
