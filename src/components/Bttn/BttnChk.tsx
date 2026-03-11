import "./Bttn.scss";
import { sz, r, th, pos } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  onDown?: PEH;
};

const BttnChk = ({ size = "1.4rem", onDown = () => {} }: Props) => {
  return (
    <div className="bttn chk" onPointerDown={onDown}>
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
          <path d={`M ${pos(-0.5)} ${pos(0.1)} L ${pos(-0.1)} ${pos(0.45)} L ${pos(0.5)} ${pos(-0.4)}`} />
        </g>
      </svg>
    </div>
  );
};

export default BttnChk;
