import { useSubjectStore } from "../../context/SubjectProvider";
import { defaultCourse, type Course, type Subject } from "../../types/Subject";
import { useEffect, useState } from "react";
import SbjTreeTitle from "./SbjTreeTitle";
import SbjTreeNext from "./SbjTreeNext";
import { getItemsByMom } from "../../utils/familyOp";
import SbjTreeItem from "./SbjTreeItem";
import { makeClassName } from "../../utils/makeClassName";

const SbjTree = ({ info }: { info?: Course }) => {
  const { sbjList, clearDrag } = useSubjectStore();
  const [isOpen, setIsOpen] = useState(true);

  const pInfo = info ?? { ...defaultCourse, ttl: "Subject Tree" };

  useEffect(() => {
    const onGlobalUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.classList.contains("sbj-tree-up")) return;
      clearDrag();
    };

    document.addEventListener("pointerup", onGlobalUp);
    return () => {
      document.removeEventListener("pointerup", onGlobalUp);
    };
  }, [clearDrag]);

  const onToggle = () => setIsOpen((b) => !b);

  return (
    <div className={`sbj-tree`}>
      <SbjTreeTitle info={pInfo} {...{ isOpen, onToggle }} />
      <div className={makeClassName("sbj-tree-contents", !isOpen && "hidden")}>
        {getItemsByMom(sbjList, pInfo.idx).map((s) =>
          s.isMom ? (
            <SbjTree key={`sbj-tree-${s.idx}`} info={s as Course} />
          ) : (
            <SbjTreeItem key={`sbj-tree-item-${s.idx}`} info={s as Subject} />
          )
        )}
      </div>
      <SbjTreeNext info={pInfo} />
    </div>
  );
};

export default SbjTree;
