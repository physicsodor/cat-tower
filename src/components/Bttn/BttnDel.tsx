import "./Bttn.scss";
import { sz, r, th, pos } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  className?: string;
  onDown?: PEH;
};

const BttnDel = ({ size = "1.4rem", className, onDown = () => {} }: Props) => {
  const h = 0.5;
  return (
    <div className={`bttn del${className ? ` ${className}` : ""}`} onPointerDown={onDown}>
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
        <g strokeWidth={th}>
          <path d={`M ${pos(h)} ${pos(h)} L ${pos(-h)} ${pos(-h)}`} />
          <path d={`M ${pos(h)} ${pos(-h)} L ${pos(-h)} ${pos(h)}`} />
        </g>
      </svg>
    </div>
  );
};

export default BttnDel;

