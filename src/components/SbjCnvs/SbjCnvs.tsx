import React, { useEffect, useState } from "react";
import { useSubjectStore } from "../../context/SubjectProvider";
import SbjCnvsItem from "./SbjCnvsItem";

const SbjCnvs = () => {
  const { isCnvsDrag, sbjList, selSet, clearCnvsDrag, setSbjPos } =
    useSubjectStore();
  const [pxy, setPxy] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dxy, setDxy] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0; // ChatGPT가 요청애니메이션프레임 어쩌구라고 설명해줌. ㅎㅎ
    const onGlobalMove = (e: PointerEvent) => {
      if (!isCnvsDrag) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setDxy({ x: e.clientX - pxy.x, y: e.clientY - pxy.y });
      });
    };

    const onGlobalUp = () => {
      if (!isCnvsDrag) return;
      setSbjPos(dxy);
      setDxy({ x: 0, y: 0 });
      clearCnvsDrag();
    };

    document.addEventListener("pointermove", onGlobalMove, { passive: true });
    document.addEventListener("pointerup", onGlobalUp, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onGlobalMove);
      document.removeEventListener("pointerup", onGlobalUp);
    };
  }, [isCnvsDrag, clearCnvsDrag, setSbjPos, dxy, pxy.x, pxy.y]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPxy({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="sbj-cnvs">
      {sbjList.map((s) => {
        if (s.sbjType === "Subject") {
          const isSelected = selSet.has(s.idx);
          return (
            <SbjCnvsItem
              key={`sbj-cnvs-item-${s.idx}`}
              info={s}
              dxy={isSelected ? dxy : { x: 0, y: 0 }}
              isSelected={isSelected}
              setPxy={onDown}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default SbjCnvs;
