import "./Bttn.scss";
import { sz, r, th, pos } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  onDown?: PEH;
};

const BttnVert = ({ onDown = () => {} }: Props) => {
  const h1 = 0.6;
  const h2 = 0.3;
  const b = 0.5;
  return (
    <div className="bttn vert" onPointerDown={onDown}>
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
          <path d={`M ${pos(0)} ${pos(h1)} L ${pos(-b)} ${pos(h2)}`} />
          <path d={`M ${pos(0)} ${pos(h1)} L ${pos(b)} ${pos(h2)}`} />
          <path d={`M ${pos(0)} ${pos(-h1)} L ${pos(-b)} ${pos(-h2)}`} />
          <path d={`M ${pos(0)} ${pos(-h1)} L ${pos(b)} ${pos(-h2)}`} />
          <path d={`M ${pos(0)} ${pos(h1)} L ${pos(0)} ${pos(-h1)}`} />
        </g>
      </svg>
    </div>
  );
};

export default BttnVert;
