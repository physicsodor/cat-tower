import type { CSSProperties } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BBox } from "../../model/rect";

type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  bbox: BBox;
  label: string;
  back?: boolean;
};

const SbjCnvsCrs = ({ setRef, idx: _idx, bbox, label, back = false }: Props) => {
  return (
    <div
      ref={setRef}
      className={makeClassName("sbj-cnvs-crs", back && "-bck")}
      style={
        {
          "--l": `${bbox.l}px`,
          "--r": `${bbox.r}px`,
          "--t": `${bbox.t}px`,
          "--b": `${bbox.b}px`,
        } as CSSProperties
      }
    >
      {!back && <span className="sbj-cnvs-crs-lbl">{label}</span>}
    </div>
  );
};

export default SbjCnvsCrs;