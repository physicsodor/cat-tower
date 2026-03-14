import "./Bttn.scss";
import { sz, r, th, pos } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  isPlus?: boolean;
  onDown?: PEH;
};

const BttnPM = ({ className, isPlus = false, onDown = () => {} }: Props) => {
  const h = 0.5;
  return (
    <div
      className={`bttn pm${className ? ` ${className}` : ""}`}
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
          {isPlus ? (
            <path d={`M ${pos(0)} ${pos(h)} L ${pos(0)} ${pos(-h)}`} />
          ) : null}
          <path d={`M ${pos(h)} ${pos(0)} L ${pos(-h)} ${pos(0)}`} />
        </g>
      </svg>
    </div>
  );
};

export default BttnPM;
