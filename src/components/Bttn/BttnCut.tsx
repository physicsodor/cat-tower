import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  onDown?: PEH;
};

const BttnCut = ({ size = "1.4rem", onDown = () => {} }: Props) => {
  return (
    <div className="bttn cut" onPointerDown={onDown}>
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
          {/* scissors blade lines */}
          <path d="M13 13 L35 35" strokeLinecap="round" />
          <path d="M35 13 L13 35" strokeLinecap="round" />
          {/* left handle circle */}
          <circle cx="13" cy="35" r="5" />
          {/* right handle circle */}
          <circle cx="35" cy="35" r="5" />
        </g>
      </svg>
    </div>
  );
};

export default BttnCut;
