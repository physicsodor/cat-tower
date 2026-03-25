import { CURVE_BASE_STROKE as BASE_STROKE } from "@/features/subject/constants";

type Props = {
  sourcePos: { x: number; y: number };
  mousePos: { x: number; y: number } | null;
  zoom: number;
  horizontal?: boolean;
};

const SbjCnvsCurve = ({
  sourcePos: { x: px, y: py },
  mousePos,
  zoom,
  horizontal = false,
}: Props) => {
  if (!mousePos) return null;
  const { x: ex, y: ey } = mousePos;
  const r = 0.3;
  const m = horizontal
    ? ex > px
      ? `${r * (px - ex) + ex} ${py}, ${r * (ex - px) + px} ${ey}`
      : `${px} ${r * (py - ey) + ey}, ${ex} ${r * (ey - py) + py}`
    : ey > py
      ? `${px} ${r * (py - ey) + ey}, ${ex} ${r * (ey - py) + py}`
      : `${r * (px - ex) + ex} ${py}, ${r * (ex - px) + px} ${ey}`;
  const d = `M ${px} ${py} C ${m}, ${ex} ${ey}`;
  return (
    <div className="sbj-cnvs-curve">
      <svg>
        <path d={d} style={{ strokeWidth: BASE_STROKE * zoom }} />
      </svg>
    </div>
  );
};

export default SbjCnvsCurve;
