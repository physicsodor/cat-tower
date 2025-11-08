import { makeClassName } from "../../utils/makeClassName";

type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  l: number;
  r: number;
  t: number;
  b: number;
  back?: boolean;
};

const SbjCnvsCrs = ({ setRef, idx, l, r, t, b, back = false }: Props) => {
  return (
    <div
      ref={setRef}
      className={`sbj-cnvs-crs${back ? "-bck" : ""}`}
      style={{
        width: `calc(${r - l}px + 2*var(--G-XL))`,
        height: `calc(${b - t}px + 2*var(--G-XL))`,
        transform: `translate(calc(${l}px - var(--G-XL)), calc(${t}px - var(--G-XL)))`,
      }}
    ></div>
  );
};

export default SbjCnvsCrs;
