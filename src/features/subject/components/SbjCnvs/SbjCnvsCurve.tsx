type Props = {
  sourcePos: { x: number; y: number };
  mousePos: { x: number; y: number } | null;
};

const SbjCnvsCurve = ({ sourcePos: { x: px, y: py }, mousePos }: Props) => {
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
        <path d={d} />
      </svg>
    </div>
  );
};

export default SbjCnvsCurve;
