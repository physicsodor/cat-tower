import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  className?: string;
  onDown?: PEH;
};

const BttnZoom1 = ({ size = "1.4rem", className, onDown = () => {} }: Props) => {
  return (
    <div className={`bttn zoom1${className ? ` ${className}` : ""}`} onPointerDown={onDown}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${sz} ${sz}`}
        style={{ borderRadius: r }}
      >
        <rect
          x={th}
          y={th}
          width={sz - 2 * th}
          height={sz - 2 * th}
          rx={r}
          ry={r}
          strokeWidth={th}
        />
        <text
          x={sz / 2}
          y={sz / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={sz * 0.3}
        >
          1:1
        </text>
      </svg>
    </div>
  );
};

export default BttnZoom1;
