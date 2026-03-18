import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { makeClassName } from "@/utils/makeClassName";
import type { BBox } from "../../model/rect";
import { useSbjData } from "../../store/SbjDataContext";
import { useSbjSelect } from "../../store/SbjSelectContext";

type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  bbox: BBox;
  label: string;
  back?: boolean;
};

const SbjCnvsCrs = ({ setRef, idx, bbox, label, back = false }: Props) => {
  const { delCrs, setTreeMom, idx2sbj } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const selectedSubjects = useMemo(() => {
    const s = new Set<number>();
    for (const i of selectedSet) {
      if (idx2sbj.get(i)?.sbjType === "SUBJECT") s.add(i);
    }
    return s;
  }, [selectedSet, idx2sbj]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (back) return;
      e.preventDefault();
      e.stopPropagation();
      setCtxMenu({ x: e.clientX, y: e.clientY });
    },
    [back],
  );

  return (
    <>
      <div
        ref={setRef}
        className={makeClassName("sbj-cnvs-crs", back && "-bck")}
        style={
          {
            "--l": `${bbox.l}px`,
            "--r": `${bbox.r}px`,
            "--t": `${bbox.t}px`,
            "--b": `${bbox.b}px`,
          } as CSSProperties
        }
        onContextMenu={onContextMenu}
      >
        {!back && <span className="sbj-cnvs-crs-lbl">{label}</span>}
      </div>
      {ctxMenu && (
        <>
          <div
            className="sbj-cnvs-ctx-overlay"
            onPointerDown={() => setCtxMenu(null)}
          />
          <div
            className="sbj-cnvs-ctx-menu"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            <div
              className="sbj-cnvs-ctx-menu-item"
              onPointerDown={(e) => {
                e.stopPropagation();
                delCrs(idx);
                setCtxMenu(null);
              }}
            >
              {label} 그룹 해제
            </div>
            {selectedSubjects.size > 0 && (
              <div
                className="sbj-cnvs-ctx-menu-item"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setTreeMom(selectedSubjects, idx);
                  setCtxMenu(null);
                }}
              >
                선택한 항목을 모두 {label} 그룹에 추가
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default SbjCnvsCrs;
