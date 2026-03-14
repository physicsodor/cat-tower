import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  onDown?: PEH;
};

const BttnCut = ({ className, onDown = () => {} }: Props) => {
  return (
    <div
      className={`bttn cut${className ? ` ${className}` : ""}`}
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
          <path d="M13 13 L35 35" strokeLinecap="round" />
          <path d="M35 13 L13 35" strokeLinecap="round" />
          <circle cx="13" cy="35" r="5" />
          <circle cx="35" cy="35" r="5" />
        </g>
      </svg>
    </div>
  );
};

export default BttnCut;
