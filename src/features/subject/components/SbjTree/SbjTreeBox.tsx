import { useEffect, useState } from "react";
import SbjTreeTitle from "./SbjTreeTitle";
import SbjTreeNext from "./SbjTreeNext";
import SbjTreeItem from "./SbjTreeItem";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjStore } from "../../context/SbjContext";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx?: number; title?: string };

const SbjTreeBox = ({ idx = -1, title = "Subject Tree:" }: Props) => {
  const { idx2sbj, idx2family, treeDrag } = useSbjStore();

  const [isOpen, setIsOpen] = useState(idx !== -1);

  useEffect(() => {
    const onGlobalUp = (e: PE) => {
      const target = e.target as HTMLElement | null;
      if (target?.classList.contains("-ovr")) return;
      treeDrag.set(new Set());
    };
    document.addEventListener("pointerup", onGlobalUp);
    return () => document.removeEventListener("pointerup", onGlobalUp);
  }, [treeDrag]);

  const onToggle = () => setIsOpen((b) => !b);

  const prevent = (e: PE) => e.preventDefault();

  return (
    <div className={`sbj-tree`} onPointerDown={prevent}>
      <SbjTreeTitle
        key={`sbj-tree-title-${idx}`}
        {...{ idx, title, isOpen, onToggle }}
      />
      <div className={makeClassName("sbj-tree-contents", !isOpen && "hidden")}>
        {(idx2family.get(idx)?.kids ?? []).map((k) => {
          const s = idx2sbj.get(k);
          if (!s) return null;
          return s.sbjType === "COURSE" ? (
            <SbjTreeBox key={`sbj-tree-${k}`} idx={k} title={s.title} />
          ) : (
            <SbjTreeItem key={`sbj-tree-item-${k}`} idx={k} title={s.title} />
          );
        })}
      </div>
      <SbjTreeNext idx={idx} />
    </div>
  );
};

export default SbjTreeBox;
