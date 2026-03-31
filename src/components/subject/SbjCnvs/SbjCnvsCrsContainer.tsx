import { useCallback, useEffect, useMemo, useState } from "react";
import { useSbjData } from "@/store/SbjDataContext";
import { useSbjSelect } from "@/store/SbjSelectContext";
import SbjCnvsCrs from "./SbjCnvsCrs";
import type { BBox } from "@/lib/rect";

type Props = {
  bboxMap: ReadonlyMap<number, BBox>;
  items: Map<number, HTMLDivElement | null>;
  back?: boolean;
  anyHovered?: boolean;
};

type CrsCtxMenu = {
  x: number;
  y: number;
  idxs: number[];
};

const SbjCnvsCrsContainer = ({ bboxMap, items, back = false, anyHovered = false }: Props) => {
  const { idx2family, idx2sbj, delCrs, setTreeMom, openEdit } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const [ctxMenu, setCtxMenu] = useState<CrsCtxMenu | null>(null);

  const selectedSubjects = useMemo(() => {
    const s = new Set<number>();
    for (const i of selectedSet) {
      if (idx2sbj.get(i)?.sbjType === "SUBJECT") s.add(i);
    }
    return s;
  }, [selectedSet, idx2sbj]);

  useEffect(() => {
    if (!ctxMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtxMenu(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ctxMenu]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const idxs: number[] = [];
      for (const el of elements) {
        const attr = el.getAttribute("data-crs-idx");
        if (attr != null) idxs.push(Number(attr));
      }
      if (idxs.length === 0) return;
      setCtxMenu({ x: e.clientX, y: e.clientY, idxs });
    },
    [],
  );

  const getLabel = useCallback(
    (idx: number) => {
      const s = idx2sbj.get(idx);
      return s ? (s.short || s.title) : "";
    },
    [idx2sbj],
  );

  return (
    <div>
      {[...idx2family].map(([idx, f]) => {
        if (!f.kids) return null;
        const bbox = bboxMap.get(idx);
        if (!bbox) return null;
        const label = getLabel(idx);
        return (
          <SbjCnvsCrs
            key={`sbj-cnvs-crs-${idx}`}
            setRef={(x) => {
              if (x) items.set(idx, x);
              else items.delete(idx);
            }}
            idx={idx}
            bbox={bbox}
            label={label}
            back={back}
            anyHovered={anyHovered}
            onContextMenu={back ? undefined : onContextMenu}
            onLabelDoubleClick={back ? undefined : () => openEdit(idx)}
          />
        );
      })}
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
            {ctxMenu.idxs.flatMap((idx) => {
              const label = getLabel(idx);
              const items = [
                <div
                  key={`${idx}-del`}
                  className="sbj-cnvs-ctx-menu-item"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    delCrs(idx);
                    setCtxMenu(null);
                  }}
                >
                  {label} 그룹 해제
                </div>,
              ];
              if (selectedSubjects.size > 0) {
                items.push(
                  <div
                    key={`${idx}-add`}
                    className="sbj-cnvs-ctx-menu-item"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setTreeMom(selectedSubjects, idx);
                      setCtxMenu(null);
                    }}
                  >
                    선택한 항목을 모두 {label} 그룹에 추가
                  </div>,
                );
              }
              return items;
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SbjCnvsCrsContainer;
