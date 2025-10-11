type Props = {
  pxy: { px: number; py: number };
  exy: { ex: number; ey: number } | null;
  oxy: { ox: number; oy: number };
};

const SbjCnvsCurve = ({ pxy: { px, py }, exy, oxy: { ox, oy } }: Props) => {
  if (!exy) return null;
  const { ex, ey } = exy;
  const w = ex > px ? ex : px;
  const h = ey > py ? ey : py;
  const d = `M ${px - ox} ${py - oy} C ${px - ox} ${(py + ey) / 2 - oy}, ${
    ex - ox
  } ${(py + ey) / 2 - oy}, ${ex - ox} ${ey - oy}`;
  return (
    <svg className="sbj-cnvs-curve" width={w} height={h}>
      <path d={d} stroke="var(--C-DD)" strokeWidth={3} fill="none" />
    </svg>
  );
};

export default SbjCnvsCurve;
