import type { CSSProperties } from "react";
import { makeClassName } from "@/utils/makeClassName";

type LRTB = { l: number; r: number; t: number; b: number };
type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  lrtb: LRTB;
  label: string;
  back?: boolean;
};

const SbjCnvsCrs = ({ setRef, idx: _idx, lrtb, label, back = false }: Props) => {
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
    >
      {!back && <span className="sbj-cnvs-crs-lbl">{label}</span>}
    </div>
  );
};

export default SbjCnvsCrs;
