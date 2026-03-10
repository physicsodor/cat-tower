import { useSbjData } from "../../context/SbjDataContext";
import SbjCnvsCurve from "./SbjCnvsCurve";

type LRTB = { l: number; r: number; t: number; b: number };
type Props = { lrtbMap: ReadonlyMap<number, LRTB>; zoom: number };

const SbjCnvsCurveContainer = ({ lrtbMap, zoom }: Props) => {
  const { idx2chain } = useSbjData();
  return (
    <div>
      {[...idx2chain].map(([idx, c]) => {
        if (!c.pre) return null;
        const toLrtb = lrtbMap.get(idx);
        if (!toLrtb) return null;
        return [...c.pre].map((i) => {
          const fromLrtb = lrtbMap.get(i);
          if (!fromLrtb) return null;
          return (
            <SbjCnvsCurve
              key={`sbj-cnvs-curve-${i}-${idx}`}
              sourcePos={{ x: (fromLrtb.l + fromLrtb.r) / 2, y: fromLrtb.b }}
              mousePos={{ x: (toLrtb.l + toLrtb.r) / 2, y: toLrtb.t }}
              zoom={zoom}
            />
          );
        });
      })}
    </div>
  );
};

export default SbjCnvsCurveContainer;
