import { useSubjectStore } from "../../context/SubjectProvider";
import { type Course } from "../../types/Curriculum";
import { useEffect, useState } from "react";
import SbjTreeTitle from "./SbjTreeTitle";
import SbjTreeNext from "./SbjTreeNext";
import { getItemsByMom } from "../../utils/familyOp";
import SbjTreeItem from "./SbjTreeItem";
import { makeClassName } from "../../utils/makeClassName";
import { generateCourseByTitle } from "../../utils/curriculumOp";

const SbjTree = ({ info }: { info?: Course }) => {
  const { sbjList, clearDrag } = useSubjectStore();
  const [isOpen, setIsOpen] = useState(true);

  const pInfo = info ?? generateCourseByTitle("Subject Tree");

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

  const prevent = (e: React.PointerEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div className={`sbj-tree`} onPointerDown={prevent}>
      <SbjTreeTitle info={pInfo} {...{ isOpen, onToggle }} />
      <div className={makeClassName("sbj-tree-contents", !isOpen && "hidden")}>
        {getItemsByMom(sbjList, pInfo.idx).map((s) =>
          s.sbjType === "Course" ? (
            <SbjTree key={`sbj-tree-${s.idx}`} info={s} />
          ) : (
            <SbjTreeItem key={`sbj-tree-item-${s.idx}`} info={s} />
          )
        )}
      </div>
      <SbjTreeNext info={pInfo} />
    </div>
  );
};

export default SbjTree;
