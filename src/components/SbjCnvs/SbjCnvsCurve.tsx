type Props = {
  pxy: { px: number; py: number };
  exy: { ex: number; ey: number } | null;
  oxy: { ox: number; oy: number };
};

const SbjCnvsCurve = ({ pxy: { px, py }, exy, oxy: { ox, oy } }: Props) => {
  if (!exy) return null;
  const { ex, ey } = exy;
  const d = `M ${px - ox} ${py - oy} C ${px - ox} ${(py + ey) / 2 - oy}, ${
    ex - ox
  } ${(py + ey) / 2 - oy}, ${ex - ox} ${ey - oy}`;
  return (
    <div className="sbj-cnvs-curve">
      <svg width="100%" height="100%">
        <path d={d} stroke="var(--C-DD)" strokeWidth={3} fill="none" />
      </svg>
    </div>
  );
};

export default SbjCnvsCurve;
