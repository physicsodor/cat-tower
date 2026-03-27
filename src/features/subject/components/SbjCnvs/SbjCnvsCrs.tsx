import { type CSSProperties } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BBox } from "../../model/rect";

type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  bbox: BBox;
  label: string;
  back?: boolean;
  anyHovered?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onLabelDoubleClick?: () => void;
};

const SbjCnvsCrs = ({ setRef, idx, bbox, label, back = false, anyHovered = false, onContextMenu, onLabelDoubleClick }: Props) => {
  return (
    <div
      ref={setRef}
      className={makeClassName("sbj-cnvs-crs", back && "-bck", anyHovered && "-non")}
      style={
        {
          "--l": `${bbox.l}px`,
          "--r": `${bbox.r}px`,
          "--t": `${bbox.t}px`,
          "--b": `${bbox.b}px`,
        } as CSSProperties
      }
      onContextMenu={onContextMenu}
      data-crs-idx={back ? undefined : String(idx)}
    >
      {!back && (
        <span
          className="sbj-cnvs-crs-lbl"
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={onLabelDoubleClick}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default SbjCnvsCrs;
