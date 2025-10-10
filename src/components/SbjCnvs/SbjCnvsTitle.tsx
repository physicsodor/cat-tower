import { useSubjectStore } from "../../context/useSubjectStore";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx: number; ttl: string };

const SbjCnvsTitle = ({ idx, ttl }: Props) => {
  const { setCnvsPxy, setCnvsDrag, slcSbj } = useSubjectStore();
  const onDown = (e: PE) => {
    e.preventDefault();
    const s = slcSbj(e, idx);
    if (s.has(idx)) {
      setCnvsDrag(s);
      setCnvsPxy({ px: e.clientX, py: e.clientY });
    }
  };

  return (
    <div className="ttl" onPointerDown={onDown}>
      {ttl}
    </div>
  );
};

export default SbjCnvsTitle;
