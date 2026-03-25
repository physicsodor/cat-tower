import { useMemo } from "react";
import { useSbjData } from "../../store/SbjDataContext";
import { useSbjSelect } from "../../store/SbjSelectContext";
import { useInfiniteCanvas } from "@/components/InfiniteCanvas";
import SbjCnvsItem from "./SbjCnvsItem";

type Props = {
  items: Map<number, HTMLDivElement | null>;
  horizontal: boolean;
  activeHoveredIdx: number | null;
  pinnedSet: ReadonlySet<number>;
  onHoverChange: (idx: number | null) => void;
  onPinToggle: (idx: number) => void;
};

const SbjCnvsItemContainer = ({ items, horizontal, activeHoveredIdx, pinnedSet, onHoverChange, onPinToggle }: Props) => {
  const { idx2sbj, idx2chain } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const { camera, dxy } = useInfiniteCanvas();

  const effectiveSources = useMemo(() => {
    const srcs = new Set<number>(pinnedSet);
    if (activeHoveredIdx !== null) srcs.add(activeHoveredIdx);
    return srcs;
  }, [activeHoveredIdx, pinnedSet]);

  return (
    <div>
      {[...idx2sbj].map(([idx, s]) => {
        if (s.sbjType === "SUBJECT") {
          const isSelected = selectedSet.has(idx);

          const rawIsHvr = effectiveSources.has(idx);
          const rawIsNxt = rawIsHvr ? false : [...effectiveSources].some(src => idx2chain.get(src)?.nxtSet?.has(idx));
          const rawIsPre = (rawIsHvr || rawIsNxt) ? false : [...effectiveSources].some(src => idx2chain.get(src)?.preSet?.has(idx));

          const isHovered = rawIsHvr;
          const isNxt = !rawIsHvr && rawIsNxt;
          const isPre = !rawIsHvr && !rawIsNxt && rawIsPre;
          const isNon = effectiveSources.size > 0 && !rawIsHvr && !rawIsNxt && !rawIsPre;
          const isPinned = pinnedSet.has(idx);

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
              isHovered={isHovered}
              isPre={isPre}
              isNxt={isNxt}
              isNon={isNon}
              isPinned={isPinned}
              horizontal={horizontal}
              onHoverChange={onHoverChange}
              onPinToggle={onPinToggle}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default SbjCnvsItemContainer;
