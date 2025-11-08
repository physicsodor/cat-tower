import { useSbjStore } from "../../context/SbjContext";
import SbjCnvsCurve from "./SbjCnvsCurve";

type LRTB = { l: number; r: number; t: number; b: number };
type Props = { lrtbMap: ReadonlyMap<number, LRTB> };

const SbjCnvsCurveContainer = ({ lrtbMap }: Props) => {
  const { idx2chain } = useSbjStore();
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
              pxy={{ px: (fromLrtb.l + fromLrtb.r) / 2, py: fromLrtb.b }}
              exy={{ ex: (toLrtb.l + toLrtb.r) / 2, ey: toLrtb.t }}
            />
          );
        });
      })}
    </div>
  );
};

export default SbjCnvsCurveContainer;
