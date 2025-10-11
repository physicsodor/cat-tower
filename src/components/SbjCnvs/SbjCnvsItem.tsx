import { makeClassName } from "../../utils/makeClassName";
import SbjCnvsTitle from "./SbjCnvsTitle";

type Props = {
  setRef: (x: HTMLDivElement | null) => void;
  idx: number;
  info: { ttl: string; x: number; y: number };
  dxy: { dx: number; dy: number };
  isSelected: boolean;
};

const SbjCnvsItem = ({
  idx,
  setRef,
  info,
  dxy: { dx, dy },
  isSelected,
}: Props) => {
  return (
    <div
      ref={setRef}
      className={makeClassName("sbj-cnvs-item", isSelected && "-slc")}
      style={{
        transform: `translate(${info.x + dx}px, ${info.y + dy}px)`,
      }}
    >
      <div className="in"></div>
      <SbjCnvsTitle idx={idx} ttl={info.ttl} />
      <div className="out"></div>
    </div>
  );
};

export default SbjCnvsItem;
