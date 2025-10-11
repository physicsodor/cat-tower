type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  l: number;
  r: number;
  t: number;
  b: number;
};

const SbjCnvsCrs = ({ setRef, idx, l, r, t, b }: Props) => {
  return (
    <div
      ref={setRef}
      className="sbj-cnvs-crs"
      style={{
        width: `calc(${r - l}px + 2*var(--G-XL))`,
        height: `calc(${b - t}px + 2*var(--G-XL))`,
        transform: `translate(calc(${l}px - var(--G-XL)), calc(${t}px - var(--G-XL)))`,
      }}
    ></div>
  );
};

export default SbjCnvsCrs;
