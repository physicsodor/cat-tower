import { useEffect, useRef, useState } from "react";
import { useSbjData } from "@/store/SbjDataContext";
import { DEFAULT_SPC_IDX } from "@/lib/Species/species";
import type { SpcNum } from "@/lib/Species/species";
import { Popup } from "@/components/Popup/Popup";

const SPC_NUM_LABELS: Record<SpcNum, string> = {
  NONE: "없음",
  INDEP: "독립",
  DEP: "계층",
};

const COLOR_CODES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

type PickerState = { idx: number; x: number; y: number } | null;

const SpeciesPanel = () => {
  const { spcTypes, addSpcType, removeSpcType, updateSpcType, isSpcPanelOpen, closeSpcPanel } = useSbjData();
  const newRowRef = useRef<HTMLInputElement | null>(null);
  const [openPicker, setOpenPicker] = useState<PickerState>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const swatchRefs = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSpcPanel();
    };
    if (isSpcPanelOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSpcPanelOpen, closeSpcPanel]);

  useEffect(() => {
    if (!openPicker) return;
    const handler = (e: PointerEvent) => {
      if (!paletteRef.current?.contains(e.target as Node) &&
          swatchRefs.current.get(openPicker.idx) !== e.target)
        setOpenPicker(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [openPicker]);

  if (!isSpcPanelOpen) return null;

  const handleAdd = () => {
    addSpcType();
    requestAnimationFrame(() => { newRowRef.current?.focus(); });
  };

  const openPickerFor = (spcIdx: number) => {
    if (openPicker?.idx === spcIdx) { setOpenPicker(null); return; }
    const btn = swatchRefs.current.get(spcIdx);
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setOpenPicker({ idx: spcIdx, x: rect.left, y: rect.bottom + 4 });
  };

  return (
    <Popup className="spc-panel-overlay" onClose={closeSpcPanel}>
      <div className="spc-panel-modal">
        <div className="spc-panel-header">
          <span className="spc-panel-title">분류 관리</span>
        </div>
        <div className="spc-panel-col-labels">
          <span className="spc-panel-col-label -color" />
          <span className="spc-panel-col-label -title">이름</span>
          <span className="spc-panel-col-label -prefix">접두어</span>
          <span className="spc-panel-col-label -number">번호</span>
        </div>
        <div className="spc-panel-list">
          {spcTypes.map((s, i) => {
            const isDefault = s.idx === DEFAULT_SPC_IDX;
            return (
              <div key={s.idx} className={`spc-panel-row${isDefault ? " -default" : ""}`}>
                <div className="spc-panel-color-wrap">
                  <button
                    ref={(el) => { if (el) swatchRefs.current.set(s.idx, el); else swatchRefs.current.delete(s.idx); }}
                    className={`spc-swatch spc-c-${s.colorCode}`}
                    onClick={() => openPickerFor(s.idx)}
                    title="색상 변경"
                  />
                </div>
                <input
                  ref={i === spcTypes.length - 1 ? newRowRef : undefined}
                  className="spc-panel-input -title"
                  value={s.title}
                  placeholder="이름"
                  onChange={(e) => updateSpcType(s.idx, { title: e.target.value })}
                />
                <input
                  className="spc-panel-input -prefix"
                  value={s.prefix}
                  placeholder="접두어"
                  onChange={(e) => updateSpcType(s.idx, { prefix: e.target.value })}
                />
                <select
                  className="spc-panel-select"
                  value={s.number}
                  onChange={(e) => updateSpcType(s.idx, { number: e.target.value as SpcNum })}
                >
                  {(["NONE", "INDEP", "DEP"] as SpcNum[]).map((v) => (
                    <option key={v} value={v}>{SPC_NUM_LABELS[v]}</option>
                  ))}
                </select>
                <button
                  className="spc-panel-del"
                  onPointerDown={() => removeSpcType(s.idx)}
                  disabled={isDefault}
                  title={isDefault ? "기본 분류는 삭제할 수 없습니다" : "삭제"}
                >
                  삭제
                </button>
              </div>
            );
          })}
        </div>
        <div className="spc-panel-footer">
          <button className="spc-panel-add" onClick={handleAdd}>
            + 분류 추가
          </button>
          <button className="spc-panel-close" onClick={closeSpcPanel}>
            닫기
          </button>
        </div>
      </div>
      {openPicker && (
        <div
          ref={paletteRef}
          className="spc-palette"
          style={{ position: "fixed", left: openPicker.x, top: openPicker.y }}
        >
          {COLOR_CODES.map((c) => (
            <button
              key={c}
              className={`spc-swatch spc-c-${c}`}
              onClick={() => {
                updateSpcType(openPicker.idx, { colorCode: c });
                setOpenPicker(null);
              }}
            />
          ))}
        </div>
      )}
    </Popup>
  );
};

export default SpeciesPanel;
