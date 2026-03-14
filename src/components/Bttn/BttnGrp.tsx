import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  onDown?: PEH;
};

const BttnGrp = ({ className, onDown = () => {} }: Props) => {
  return (
    <div
      className={`bttn grp${className ? ` ${className}` : ""}`}
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
          <rect x="9" y="9" width="30" height="30" strokeDasharray="5 5" />
          <rect x="20" y="14" width="8" height="5" rx="1.5" />
          <rect x="14" y="29" width="7" height="5" rx="1.5" />
          <rect x="27" y="29" width="7" height="5" rx="1.5" />
          <path d="M24 19v5M17 29v-5h14v5" />
        </g>
      </svg>
    </div>
  );
};

export default BttnGrp;
