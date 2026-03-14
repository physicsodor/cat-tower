import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  onDown?: PEH;
};

const BttnEdt = ({ onDown = () => {} }: Props) => {
  return (
    <div className="bttn edt" onPointerDown={onDown}>
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
          <path d="M 30 8 L 40 18 L 19 39 L 9 41 L 11 31 Z" />
          <path d="M 26 22 L 34 14" />
        </g>
      </svg>
    </div>
  );
};

export default BttnEdt;
