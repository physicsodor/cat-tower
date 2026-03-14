import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  onDown?: PEH;
};

const BttnFit = ({ className, onDown = () => {} }: Props) => {
  return (
    <div
      className={`bttn fit${className ? ` ${className}` : ""}`}
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
          <rect x="14" y="14" width="20" height="20" rx="1.5" />
          <path d="M9 18v-9h9M30 9h9v9M39 30v9h-9M18 39h-9v-9" />
        </g>
      </svg>
    </div>
  );
};

export default BttnFit;
