import { useSbjData } from "../../store/SbjDataContext";
import SbjCnvsCurve from "./SbjCnvsCurve";
import type { BBox } from "../../model/rect";

type Props = { bboxMap: ReadonlyMap<number, BBox>; zoom: number };

const SbjCnvsCurveContainer = ({ bboxMap, zoom }: Props) => {
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
          return (
            <SbjCnvsCurve
              key={`sbj-cnvs-curve-${i}-${idx}`}
              sourcePos={{ x: fromBBox.x, y: fromBBox.b }}
              mousePos={{ x: toBBox.x, y: toBBox.t }}
              zoom={zoom}
            />
          );
        });
      })}
    </div>
  );
};

export default SbjCnvsCurveContainer;
