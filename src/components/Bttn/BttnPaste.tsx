import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  onDown?: PEH;
};

const BttnPaste = ({ size = "1.4rem", onDown = () => {} }: Props) => {
  return (
    <div className="bttn pst" onPointerDown={onDown}>
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
          {/* clipboard body */}
          <rect x={11} y={16} width={26} height={22} rx={3} />
          {/* clipboard tab */}
          <rect x={17} y={10} width={14} height={9} rx={2} />
          {/* lines */}
          <path d="M16 24 h16 M16 30 h10" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default BttnPaste;
