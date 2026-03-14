import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  className?: string;
  onDown?: PEH;
};

const BttnAutoLayout = ({ size = "1.4rem", className, onDown = () => {} }: Props) => {
  return (
    <div className={`bttn auto-layout${className ? ` ${className}` : ""}`} onPointerDown={onDown}>
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
          <circle cx="24" cy="7.5" r="4.5" />
          <circle cx="10.5" cy="25.5" r="4.5" />
          <circle cx="37.5" cy="25.5" r="4.5" />
          <circle cx="24" cy="42" r="4.5" />
          <path d="M24 12v6M19.2 28.5 15 27M28.8 28.5 33 27M24 37.5v-6" />
        </g>
      </svg>
    </div>
  );
};

export default BttnAutoLayout;
