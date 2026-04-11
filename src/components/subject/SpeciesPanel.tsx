import { useEffect, useRef } from "react";
import { useSbjData } from "@/store/SbjDataContext";
import { DEFAULT_SPC_IDX } from "@/lib/Species/species";
import type { SpcNum } from "@/lib/Species/species";
import { Popup } from "@/components/Popup/Popup";

const SPC_NUM_LABELS: Record<SpcNum, string> = {
  NONE: "없음",
  INDEP: "독립",
  DEP: "계층",
};

const SpeciesPanel = () => {
  const { spcTypes, addSpcType, removeSpcType, updateSpcType, isSpcPanelOpen, closeSpcPanel } = useSbjData();
  const newRowRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSpcPanel();
    };
    if (isSpcPanelOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSpcPanelOpen, closeSpcPanel]);

  if (!isSpcPanelOpen) return null;

  const handleAdd = () => {
    addSpcType();
    requestAnimationFrame(() => {
      newRowRef.current?.focus();
    });
  };

  return (
    <Popup className="spc-panel-overlay" onClose={closeSpcPanel}>
      <div className="spc-panel-modal">
        <div className="spc-panel-header">
          <span className="spc-panel-title">분류 관리</span>
        </div>
        <div className="spc-panel-col-labels">
          <span className="spc-panel-col-label -title">이름</span>
          <span className="spc-panel-col-label -prefix">접두어</span>
          <span className="spc-panel-col-label -number">번호</span>
        </div>
        <div className="spc-panel-list">
          {spcTypes.map((s, i) => {
            const isDefault = s.idx === DEFAULT_SPC_IDX;
            return (
              <div key={s.idx} className={`spc-panel-row${isDefault ? " -default" : ""}`}>
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
    </Popup>
  );
};

export default SpeciesPanel;
