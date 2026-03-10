import { useCallback, useEffect, useRef, useState } from "react";
import { useSbjData } from "../context/SbjDataContext";
import {
  renderMarkup,
  countBytes,
  limitBytes,
} from "@/components/TextEditor";
import TextEditor from "@/components/TextEditor";

type Fields = { title: string; short?: string; content: string; description: string };

// ── Edit Form ─────────────────────────────────────────────────────────────────

type FormProps = {
  idx: number;
  info: Fields;
  closeEdit: () => void;
  updateSbj: (idx: number, fields: Fields) => void;
};

const SbjEditForm = ({ idx, info, closeEdit, updateSbj }: FormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftShort, setDraftShort] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  // Use ref for content — avoids re-render on every keystroke
  const contentRef = useRef(info.content);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeEdit(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeEdit]);

  const startEdit = () => {
    setDraftTitle(info.title);
    setDraftShort(info.short ?? "");
    contentRef.current = info.content;
    setDraftDescription(info.description);
    setIsEditing(true);
  };

  const onCancel = () => setIsEditing(false);

  const onConfirm = () => {
    updateSbj(idx, {
      title: draftTitle.trim() || info.title,
      short: draftShort || undefined,
      content: contentRef.current,
      description: draftDescription,
    });
    setIsEditing(false);
  };

  // Stable callback — never causes TextEditor re-renders
  const onContentChange = useCallback((v: string) => { contentRef.current = v; }, []);

  const shortBytes = countBytes(draftShort);
  const descBytes = countBytes(draftDescription);

  return (
    <div className="sbj-edit-overlay" onPointerDown={closeEdit}>
      <div className="sbj-edit-modal" onPointerDown={(e) => e.stopPropagation()}>
        {isEditing ? (
          <>
            <div className="sbj-edit-row">
              <label>제목</label>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={info.title}
                autoFocus
              />
            </div>
            <div className="sbj-edit-row">
              <label>약칭</label>
              <input
                value={draftShort}
                onChange={(e) => setDraftShort(limitBytes(e.target.value, 10))}
              />
              <span className="sbj-edit-bytes">{shortBytes}/10</span>
            </div>
            <div className="sbj-edit-row -top">
              <label>내용</label>
              <TextEditor value={info.content} onChange={onContentChange} />
            </div>
            <div className="sbj-edit-row">
              <label>요약</label>
              <input
                value={draftDescription}
                onChange={(e) => setDraftDescription(limitBytes(e.target.value, 20))}
              />
              <span className="sbj-edit-bytes">{descBytes}/20</span>
            </div>
            <div className="sbj-edit-btns">
              <button className="sbj-edit-btn" onClick={onCancel}>취소</button>
              <button className="sbj-edit-btn -confirm" onClick={onConfirm}>확인</button>
            </div>
          </>
        ) : (
          <>
            <div className="sbj-edit-row">
              <label>제목</label>
              <span className="sbj-edit-value">{info.title}</span>
            </div>
            <div className="sbj-edit-row">
              <label>약칭</label>
              <span className="sbj-edit-value -muted">{info.short || "—"}</span>
            </div>
            <div className="sbj-edit-row -top">
              <label>내용</label>
              <div className="sbj-edit-content">
                {info.content
                  ? renderMarkup(info.content)
                  : <span className="sbj-edit-value -muted">내용 없음</span>}
              </div>
            </div>
            <div className="sbj-edit-row">
              <label>요약</label>
              <span className="sbj-edit-value -muted">{info.description || "—"}</span>
            </div>
            <div className="sbj-edit-btns">
              <button className="sbj-edit-btn" onClick={closeEdit}>닫기</button>
              <button className="sbj-edit-btn -confirm" onClick={startEdit}>수정</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Modal wrapper ─────────────────────────────────────────────────────────────

const SbjEditModal = () => {
  const { editingIdx, closeEdit, updateSbj, idx2sbj } = useSbjData();
  if (editingIdx === null) return null;
  const info = idx2sbj.get(editingIdx);
  if (!info || info.sbjType !== "SUBJECT") return null;
  return <SbjEditForm key={editingIdx} idx={editingIdx} info={info} closeEdit={closeEdit} updateSbj={updateSbj} />;
};

export default SbjEditModal;
