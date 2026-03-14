import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  disabled?: boolean;
  onDown?: PEH;
};

const BttnRedo = ({ className, disabled, onDown = () => {} }: Props) => {
  return (
    <div
      className={`bttn redo${disabled ? " -disabled" : ""}${className ? ` ${className}` : ""}`}
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
          <path d="M 14.8 33.9 A 13 13 0 1 1 33.2 33.9" />
          <polyline points="32.7 27.9 33.2 33.9 38.1 30.5" />
        </g>
      </svg>
    </div>
  );
};

export default BttnRedo;
