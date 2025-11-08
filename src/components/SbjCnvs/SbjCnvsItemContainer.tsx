import { useSubjectStore } from "../../context/useSubjectStore";
import SbjCnvsItem from "./SbjCnvsItem";

type Props = {
  items: Map<number, HTMLDivElement | null>;
  dxy: { dx: number; dy: number };
};

const SbjCnvsItemContainer = ({ items, dxy }: Props) => {
  const { idx2sbj, slcSet } = useSubjectStore();
  return (
    <div>
      {[...idx2sbj].map(([idx, s]) => {
        if (s.sbjType === "SUBJECT") {
          const isSelected = slcSet.has(idx);
          return (
            <SbjCnvsItem
              key={`sbj-cnvs-item-${idx}`}
              setRef={(x) => {
                if (x) items.set(idx, x);
                else items.delete(idx);
              }}
              idx={idx}
              info={s}
              dxy={isSelected ? dxy : { dx: 0, dy: 0 }}
              isSelected={isSelected}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default SbjCnvsItemContainer;
