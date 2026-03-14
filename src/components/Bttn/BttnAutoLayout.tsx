import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  onDown?: PEH;
};

const BttnAutoLayout = ({ className, onDown = () => {} }: Props) => {
  return (
    <div
      className={`bttn auto-layout${className ? ` ${className}` : ""}`}
      onPointerDown={onDown}
    >
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
          <rect x="20" y="9" width="8" height="7" rx="1.5" />
          <rect x="8" y="32" width="8" height="7" rx="1.5" />
          <rect x="20" y="32" width="8" height="7" rx="1.5" />
          <rect x="32" y="32" width="8" height="7" rx="1.5" />
          <path d="M24 16v16M12 32v-8H36v8" />
        </g>
      </svg>
    </div>
  );
};

export default BttnAutoLayout;
