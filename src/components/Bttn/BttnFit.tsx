import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  size?: string;
  className?: string;
  onDown?: PEH;
};

const BttnFit = ({ size = "1.4rem", className, onDown = () => {} }: Props) => {
  return (
    <div className={`bttn fit${className ? ` ${className}` : ""}`} onPointerDown={onDown}>
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
          <rect x="10.5" y="10.5" width="27" height="27" rx="1.5" />
          <path d="M3 12V3h9M45 12V3h-9M3 36v9h9M45 36v9h-9" />
        </g>
      </svg>
    </div>
  );
};

export default BttnFit;
