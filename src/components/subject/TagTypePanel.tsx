import { useEffect, useRef } from "react";
import { useSbjData } from "@/store/SbjDataContext";
import { Popup } from "@/components/Popup/Popup";

const TagTypePanel = () => {
  const { tagTypes, addTagType, renameTagType, deleteTagType, isTagPanelOpen, closeTagPanel } = useSbjData();
  const newRowRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTagPanel();
    };
    if (isTagPanelOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTagPanelOpen, closeTagPanel]);

  if (!isTagPanelOpen) return null;

  const handleAdd = () => {
    addTagType();
    requestAnimationFrame(() => {
      newRowRef.current?.focus();
    });
  };

  return (
    <Popup className="tag-panel-overlay" onClose={closeTagPanel}>
      <div className="tag-panel-modal">
        <div className="tag-panel-header">
          <span className="tag-panel-title">태그 관리</span>
        </div>
        <div className="tag-panel-list">
          {tagTypes.length === 0 && (
            <span className="tag-panel-empty">태그 없음</span>
          )}
          {tagTypes.map((t, i) => (
            <div key={t.idx} className="tag-panel-row">
              <input
                ref={i === tagTypes.length - 1 ? newRowRef : undefined}
                className="tag-panel-input"
                value={t.title}
                placeholder="태그 이름"
                onChange={(e) => renameTagType(t.idx, e.target.value)}
              />
              <button
                className="tag-panel-del"
                onPointerDown={() => deleteTagType(t.idx)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <div className="tag-panel-footer">
          <button className="tag-panel-add" onClick={handleAdd}>
            + 태그 추가
          </button>
          <button className="tag-panel-close" onClick={closeTagPanel}>
            닫기
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default TagTypePanel;
