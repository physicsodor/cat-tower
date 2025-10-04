import { type Course, type Curriculum } from "../../types/Curriculum";
import { useEffect, useMemo, useState } from "react";
import SbjTreeTitle from "./SbjTreeTitle";
import SbjTreeNext from "./SbjTreeNext";
import SbjTreeItem from "./SbjTreeItem";
import { makeClassName } from "../../utils/makeClassName";
// import { generateCourseByTitle } from "../../utils/curriculumOp";
import { makeFamilyMap } from "../../utils/familyOp_old";
import { useSubjectStore } from "../../context/useSubjectStore";
import { newCourse } from "../../utils/curriculumOp_old";

type Props = {
  info?: Course;
  familyMap?: {
    idx2item: ReadonlyMap<number, Curriculum>;
    mom2idxs: ReadonlyMap<number, number[]>;
  };
};

const SbjTree = ({ info, familyMap }: Props) => {
  const { sbjList, clearTreeDrag } = useSubjectStore();
  const [isOpen, setIsOpen] = useState(true);

  const pInfo = info ?? { ...newCourse(sbjList), idx: -1, ttl: "Subject List" };

  const pMap = useMemo(
    () => familyMap ?? makeFamilyMap(sbjList),
    [familyMap, sbjList]
  );

  const broItems = useMemo(
    () =>
      pMap.mom2idxs.get(pInfo.idx)?.map((idx) => pMap.idx2item.get(idx)) ?? [],
    [pInfo.idx, pMap.idx2item, pMap.mom2idxs]
  );

  useEffect(() => {
    const onGlobalUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.classList.contains("sbj-tree-up")) return;
      clearTreeDrag();
    };

    document.addEventListener("pointerup", onGlobalUp);
    return () => {
      document.removeEventListener("pointerup", onGlobalUp);
    };
  }, [clearTreeDrag]);

  const onToggle = () => setIsOpen((b) => !b);

  const prevent = (e: React.PointerEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div className={`sbj-tree`} onPointerDown={prevent}>
      <SbjTreeTitle info={pInfo} {...{ isOpen, onToggle }} />
      <div className={makeClassName("sbj-tree-contents", !isOpen && "hidden")}>
        {broItems.map((s) =>
          s === undefined ? null : s.sbjType === "COURSE" ? (
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
