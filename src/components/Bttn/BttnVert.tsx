import { sz, r, th, o } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  onDown?: PEH;
};

const BttnVert = ({ size = "1.4rem", onDown = () => {} }: Props) => {
  const h1 = 0.6;
  const h2 = 0.3;
  const b = 0.5;
  return (
    <div className="bttn vert" onPointerDown={onDown}>
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
          <path d={`M ${o(0)} ${o(h1)} L ${o(-b)} ${o(h2)}`} />
          <path d={`M ${o(0)} ${o(h1)} L ${o(b)} ${o(h2)}`} />
          <path d={`M ${o(0)} ${o(-h1)} L ${o(-b)} ${o(-h2)}`} />
          <path d={`M ${o(0)} ${o(-h1)} L ${o(b)} ${o(-h2)}`} />
          <path d={`M ${o(0)} ${o(h1)} L ${o(0)} ${o(-h1)}`} />
        </g>
      </svg>
    </div>
  );
};

export default BttnVert;

