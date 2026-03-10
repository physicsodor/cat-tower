const BASE_STROKE = 4;

type Props = {
  sourcePos: { x: number; y: number };
  mousePos: { x: number; y: number } | null;
  zoom: number;
};

const SbjCnvsCurve = ({ sourcePos: { x: px, y: py }, mousePos, zoom }: Props) => {
  if (!mousePos) return null;
  const { x: ex, y: ey } = mousePos;
  const m =
    ey > py
      ? `${px} ${(py + ey) / 2}, ${ex} ${(py + ey) / 2}`
      : `${(px + ex) / 2} ${py}, ${(px + ex) / 2} ${ey}`;
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
