import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  onDown?: PEH;
};

const BttnCopy = ({ className, onDown = () => {} }: Props) => {
  return (
    <div
      className={`bttn cpy${className ? ` ${className}` : ""}`}
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
          {/* back rect */}
          <rect x={10} y={18} width={20} height={22} rx={3} />
          {/* front rect */}
          <rect x={18} y={10} width={20} height={22} rx={3} />
        </g>
      </svg>
    </div>
  );
};

export default BttnCopy;
