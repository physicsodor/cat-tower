import { useCallback, useEffect, useRef, useState } from "react";
import { useSbjData } from "../store/SbjDataContext";
import { renderMarkup, countBytes, limitBytes } from "@/components/TextEditor";
import TextEditor from "@/components/TextEditor";
import { SHORT_MAX_BYTES } from "@/features/subject/constants";

type Fields = {
  title: string;
  short?: string;
  content: string;
};
type CrsFields = { title: string; short?: string };

// ── Edit Form ─────────────────────────────────────────────────────────────────

type FormProps = {
  idx: number;
  info: Fields;
  closeEdit: () => void;
  updateSbj: (idx: number, fields: Fields) => void;
};

const SbjEditForm = ({ idx, info, closeEdit, updateSbj }: FormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftShort, setDraftShort] = useState("");
  // Use refs — avoids re-render on every keystroke
  const titleRef = useRef(info.title);
  const contentRef = useRef(info.content);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeEdit]);

  const startEdit = () => {
    titleRef.current = info.title;
    setDraftShort(info.short ?? "");
    contentRef.current = info.content;
    setIsEditing(true);
  };

  const onCancel = () => setIsEditing(false);

  const onConfirm = () => {
    updateSbj(idx, {
      title: titleRef.current.trim() || info.title,
      short: draftShort || undefined,
      content: contentRef.current,
    });
    setIsEditing(false);
  };

  // Stable callbacks — never cause TextEditor re-renders
  const onTitleChange = useCallback((v: string) => {
    titleRef.current = v;
  }, []);
  const onContentChange = useCallback((v: string) => {
    contentRef.current = v;
  }, []);

  const shortBytes = countBytes(draftShort);

  return (
    <div className="sbj-edit-overlay" onPointerDown={closeEdit}>
      <div
        className="sbj-edit-modal"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <>
            <div className="sbj-edit-row -top">
              <label>제목</label>
              <TextEditor
                value={info.title}
                onChange={onTitleChange}
                singleLine
              />
            </div>
            <div className="sbj-edit-row">
              <label>약칭</label>
              <input
                value={draftShort}
                onChange={(e) =>
                  setDraftShort(limitBytes(e.target.value, SHORT_MAX_BYTES))
                }
              />
              <span className="sbj-edit-bytes">
                {shortBytes / 2}/{SHORT_MAX_BYTES / 2}
              </span>
            </div>
            <div className="sbj-edit-row -top">
              <label>내용</label>
              <TextEditor value={info.content} onChange={onContentChange} />
            </div>
            <div className="sbj-edit-btns">
              <button className="sbj-edit-btn" onClick={onCancel}>
                취소
              </button>
              <button className="sbj-edit-btn -confirm" onClick={onConfirm}>
                확인
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="sbj-edit-row">
              <label>제목</label>
              {renderMarkup(info.title)}
            </div>
            <div className="sbj-edit-row">
              <label>내용</label>
              <div className="sbj-edit-content">
                {info.content ? (
                  renderMarkup(info.content)
                ) : (
                  <span className="sbj-edit-value -muted">내용 없음</span>
                )}
              </div>
            </div>
            <div className="sbj-edit-btns">
              <button className="sbj-edit-btn" onClick={closeEdit}>
                닫기
              </button>
              <button className="sbj-edit-btn -confirm" onClick={startEdit}>
                수정
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Course Edit Form ───────────────────────────────────────────────────────────

type CrsFormProps = {
  idx: number;
  info: CrsFields;
  closeEdit: () => void;
  updateCrs: (idx: number, fields: CrsFields) => void;
};

const CrsEditForm = ({ idx, info, closeEdit, updateCrs }: CrsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftShort, setDraftShort] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeEdit]);

  const startEdit = () => {
    setDraftTitle(info.title);
    setDraftShort(info.short ?? "");
    setIsEditing(true);
  };

  const onCancel = () => setIsEditing(false);

  const onConfirm = () => {
    updateCrs(idx, {
      title: draftTitle.trim() || info.title,
      short: draftShort || undefined,
    });
    setIsEditing(false);
  };

  const shortBytes = countBytes(draftShort);

  return (
    <div className="sbj-edit-overlay" onPointerDown={closeEdit}>
      <div
        className="sbj-edit-modal"
        onPointerDown={(e) => e.stopPropagation()}
      >
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
                onChange={(e) =>
                  setDraftShort(limitBytes(e.target.value, SHORT_MAX_BYTES))
                }
              />
              <span className="sbj-edit-bytes">
                {shortBytes}/{SHORT_MAX_BYTES}
              </span>
            </div>
            <div className="sbj-edit-btns">
              <button className="sbj-edit-btn" onClick={onCancel}>
                취소
              </button>
              <button className="sbj-edit-btn -confirm" onClick={onConfirm}>
                확인
              </button>
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
            <div className="sbj-edit-btns">
              <button className="sbj-edit-btn" onClick={closeEdit}>
                닫기
              </button>
              <button className="sbj-edit-btn -confirm" onClick={startEdit}>
                수정
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Modal wrapper ─────────────────────────────────────────────────────────────

const SbjEditModal = () => {
  const { editingIdx, closeEdit, updateSbj, updateCrs, idx2sbj } = useSbjData();
  if (editingIdx === null) return null;
  const info = idx2sbj.get(editingIdx);
  if (!info) return null;
  if (info.sbjType === "COURSE")
    return (
      <CrsEditForm
        key={editingIdx}
        idx={editingIdx}
        info={info}
        closeEdit={closeEdit}
        updateCrs={updateCrs}
      />
    );
  return (
    <SbjEditForm
      key={editingIdx}
      idx={editingIdx}
      info={info}
      closeEdit={closeEdit}
      updateSbj={updateSbj}
    />
  );
};

export default SbjEditModal;
