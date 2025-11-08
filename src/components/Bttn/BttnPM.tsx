import { sz, r, th, o } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  isPlus?: boolean;
  onDown?: PEH;
};

const BttnPM = ({
  size = "1.4rem",
  isPlus = false,
  onDown = () => {},
}: Props) => {
  const h = 0.5;
  return (
    <div className="bttn pm" onPointerDown={onDown}>
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
          {isPlus ? <path d={`M ${o(0)} ${o(h)} L ${o(0)} ${o(-h)}`} /> : null}
          <path d={`M ${o(h)} ${o(0)} L ${o(-h)} ${o(0)}`} />
        </g>
      </svg>
    </div>
  );
};

export default BttnPM;

