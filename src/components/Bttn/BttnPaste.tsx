import "./Bttn.scss";
import { sz, r, th } from "./BttnConstants";
type PE = React.PointerEvent | PointerEvent;
type PEH = (e: PE) => void;

type Props = {
  className?: string;
  onDown?: PEH;
};

const BttnPaste = ({ className, onDown = () => {} }: Props) => {
  return (
    <div
      className={`bttn pst${className ? ` ${className}` : ""}`}
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
          <rect x={11} y={16} width={26} height={22} rx={3} />
          <rect x={17} y={10} width={14} height={9} rx={2} />
          <path d="M16 24 h16 M16 30 h10" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default BttnPaste;
