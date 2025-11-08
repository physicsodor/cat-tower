type Props = {
  pxy: { px: number; py: number };
  exy: { ex: number; ey: number } | null;
};

const SbjCnvsCurve = ({ pxy: { px, py }, exy }: Props) => {
  if (!exy) return null;
  const { ex, ey } = exy;
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

