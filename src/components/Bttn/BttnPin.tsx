import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";

type Props = {
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
};

const BttnPin = ({ className, isActive = false, onClick }: Props) => {
  return (
    <div
      className={`bttn pin${isActive ? " -active" : ""}${className ? ` ${className}` : ""}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
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
          <path d="M25 20 a6 3 45 0 1 6 -6 l4 4 a6 3 45 0 1 -6 6 l-16 12 l12 -16 l4 4" />
        </g>
      </svg>
    </div>
  );
};

export default BttnPin;
