import type { CSSProperties } from "react";
import { makeClassName } from "@/utils/makeClassName";

type LRTB = { l: number; r: number; t: number; b: number };
type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  lrtb: LRTB;
  back?: boolean;
};

const SbjCnvsCrs = ({ setRef, idx, lrtb, back = false }: Props) => {
  return (
    <div
      ref={setRef}
      className={makeClassName("sbj-cnvs-crs", back && "-bck")}
      style={
        {
          "--l": `${lrtb.l}px`,
          "--r": `${lrtb.r}px`,
          "--t": `${lrtb.t}px`,
          "--b": `${lrtb.b}px`,
        } as CSSProperties
      }
    ></div>
  );
};

export default SbjCnvsCrs;

