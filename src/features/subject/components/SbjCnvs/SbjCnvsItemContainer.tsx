import { useState } from "react";
import { useSbjData } from "../../store/SbjDataContext";
import { useSbjSelect } from "../../store/SbjSelectContext";
import { useInfiniteCanvas } from "@/components/InfiniteCanvas";
import SbjCnvsItem from "./SbjCnvsItem";

type Props = {
  items: Map<number, HTMLDivElement | null>;
};

const SbjCnvsItemContainer = ({ items }: Props) => {
  const { idx2sbj, idx2chain } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const { camera, dxy } = useInfiniteCanvas();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chain = hoveredIdx !== null ? idx2chain.get(hoveredIdx) : null;
  const preSet = chain?.preSet ?? null;
  const nxtSet = chain?.nxtSet ?? null;

  return (
    <div>
      {[...idx2sbj].map(([idx, s]) => {
        if (s.sbjType === "SUBJECT") {
          const isSelected = selectedSet.has(idx);
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
              camera={camera}
              isSelected={isSelected}
              isHovered={idx === hoveredIdx}
              isPre={preSet?.has(idx) ?? false}
              isNxt={nxtSet?.has(idx) ?? false}
              onHoverChange={setHoveredIdx}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default SbjCnvsItemContainer;
