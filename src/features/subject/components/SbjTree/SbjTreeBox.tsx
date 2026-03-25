import { useEffect, useState } from "react";
import SbjTreeTitle from "./SbjTreeTitle";
import SbjTreeNext from "./SbjTreeNext";
import SbjTreeItem from "./SbjTreeItem";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjData } from "../../store/SbjDataContext";

type PE = React.PointerEvent | PointerEvent;
type Props = { idx?: number; title?: string; numPrefix?: string };

const SbjTreeBox = ({ idx = -1, title = "Subject Tree", numPrefix }: Props) => {
  const { idx2sbj, idx2family, treeDrag } = useSbjData();

  const [isOpen, setIsOpen] = useState(true);

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

  const depth = numPrefix ? numPrefix.split(".").length : 0;
  const depthClass = depth > 0 ? (depth % 2 === 1 ? "-d-odd" : "-d-even") : null;

  return (
    <div className={makeClassName("sbj-tree", depthClass)} onPointerDown={prevent}>
      <SbjTreeTitle
        key={`sbj-tree-title-${idx}`}
        {...{ idx, title, isOpen, onToggle, numPrefix }}
      />
      <div className={makeClassName("sbj-tree-contents", !isOpen && "-hdn")}>
        {(idx2family.get(idx)?.kids ?? []).map((k, i) => {
          const s = idx2sbj.get(k);
          if (!s) return null;
          const childNum = numPrefix ? `${numPrefix}.${i + 1}` : `${i + 1}`;
          const childTitle = (s.short || s.title).replace(/\n/g, " ");
          return s.sbjType === "COURSE" ? (
            <SbjTreeBox
              key={`sbj-tree-${k}`}
              idx={k}
              title={childTitle}
              numPrefix={childNum}
            />
          ) : (
            <SbjTreeItem
              key={`sbj-tree-item-${k}`}
              idx={k}
              title={childTitle}
              numPrefix={childNum}
            />
          );
        })}
      </div>
      <SbjTreeNext idx={idx} />
    </div>
  );
};

export default SbjTreeBox;
