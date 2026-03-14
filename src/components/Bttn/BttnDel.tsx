import "./Bttn.scss";
import { sz, r, th, pos } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  onDown?: PEH;
};

const BttnDel = ({ className, onDown = () => {} }: Props) => {
  const h = 0.5;
  return (
    <div
      className={`bttn del${className ? ` ${className}` : ""}`}
      onPointerDown={onDown}
    >
      <svg viewBox={`0 0 ${sz} ${sz}`} style={{ borderRadius: r }}>
        <rect
          className="bck"
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
