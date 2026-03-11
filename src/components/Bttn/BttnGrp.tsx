import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  onDown?: PEH;
};

const BttnGrp = ({ size = "1.4rem", onDown = () => {} }: Props) => {
  return (
    <div className="bttn grp" onPointerDown={onDown}>
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
          <rect x={8} y={11} width={13} height={7} rx={2} />
          <rect x={8} y={17} width={32} height={20} rx={3} />
        </g>
      </svg>
    </div>
  );
};

export default BttnGrp;
