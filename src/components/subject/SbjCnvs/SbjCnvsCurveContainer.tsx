import { useSbjData } from "@/store/SbjDataContext";
import SbjCnvsCurve from "./SbjCnvsCurve";
import type { BBox } from "@/lib/rect";

type Props = { bboxMap: ReadonlyMap<number, BBox>; zoom: number; horizontal: boolean };

const SbjCnvsCurveContainer = ({ bboxMap, zoom, horizontal }: Props) => {
  const { idx2chain } = useSbjData();
  return (
    <div>
      {[...idx2chain].map(([idx, c]) => {
        if (!c.pre) return null;
        const toBBox = bboxMap.get(idx);
        if (!toBBox) return null;
        return [...c.pre].map((i) => {
          const fromBBox = bboxMap.get(i);
          if (!fromBBox) return null;
          const sourcePos = horizontal
            ? { x: fromBBox.r, y: fromBBox.y }
            : { x: fromBBox.x, y: fromBBox.b };
          const mousePos = horizontal
            ? { x: toBBox.l, y: toBBox.y }
            : { x: toBBox.x, y: toBBox.t };
          return (
            <SbjCnvsCurve
              key={`sbj-cnvs-curve-${i}-${idx}`}
              sourcePos={sourcePos}
              mousePos={mousePos}
              zoom={zoom}
              horizontal={horizontal}
            />
          );
        });
      })}
    </div>
  );
};

export default SbjCnvsCurveContainer;
