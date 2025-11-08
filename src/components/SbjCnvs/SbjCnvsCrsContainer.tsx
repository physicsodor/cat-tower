import { useSubjectStore } from "../../context/useSubjectStore";
import SbjCnvsCrs from "./SbjCnvsCrs";

type LRTB = { l: number; r: number; t: number; b: number };
type Props = {
  lrtbMap: ReadonlyMap<number, LRTB>;
  items: Map<number, HTMLDivElement | null>;
  back?: boolean;
};

const SbjCnvsCrsContainer = ({ lrtbMap, items, back = false }: Props) => {
  const { idx2family } = useSubjectStore();
  return (
    <div>
      {[...idx2family].map(([idx, f]) => {
        if (!f.kids) return null;
        const lrtb = lrtbMap.get(idx);
        if (!lrtb) return null;
        return (
          <SbjCnvsCrs
            key={`sbj-cnvs-crs-${idx}`}
            setRef={(x) => {
              if (x) items.set(idx, x);
              else items.delete(idx);
            }}
            {...{ idx, lrtb, back }}
          />
        );
      })}
    </div>
  );
};

export default SbjCnvsCrsContainer;
