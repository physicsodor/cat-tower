import { sz, r, th, o } from "./BttnConstants";
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
          <path d={`M ${o(-0.5)} ${o(0.1)} L ${o(-0.1)} ${o(0.45)} L ${o(0.5)} ${o(-0.4)}`} />
        </g>
      </svg>
    </div>
  );
};

export default BttnChk;
