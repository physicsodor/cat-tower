import { useCallback, useEffect, useRef, useState } from "react";
import { useSbjData } from "@/store/SbjDataContext";
import { renderMarkup, countBytes, limitBytes } from "@/components/TextEditor";
import TextEditor from "@/components/TextEditor";
import { SHORT_MAX_BYTES } from "@/lib/constants";
import type { TagType } from "@/lib/TagItem/tagItem";
import type { SpeciesType } from "@/lib/Species/species";
import { DEFAULT_SPC_IDX } from "@/lib/Species/species";
import { Popup } from "@/components/Popup/Popup";

type Fields = {
  title: string;
  short?: string;
  content: string;
};
type CrsFields = { title: string; short?: string };

// ── Tag Hash Input ────────────────────────────────────────────────────────────

type TagHashInputProps = {
  idx: number;
  tagTypes: TagType[];
  tagSet: Set<number> | undefined;
  addTagType: () => number;
  renameTagType: (idx: number, title: string) => void;
  toggleTag: (itemIdx: number, tagIdx: number) => void;
};

const TagHashInput = ({ idx, tagTypes, tagSet, addTagType, renameTagType, toggleTag }: TagHashInputProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const available = tagTypes.filter(
    (t) => !tagSet?.has(t.idx) && t.title.toLowerCase().includes(query.toLowerCase()),
  );

  const applyExisting = (tagIdx: number) => {
    toggleTag(idx, tagIdx);
    setQuery("");
    setOpen(false);
  };

  const createAndApply = () => {
    if (!query.trim()) return;
    const newIdx = addTagType();
    renameTagType(newIdx, query.trim());
    toggleTag(idx, newIdx);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (available.length > 0) applyExisting(available[0].idx);
      else createAndApply();
    } else if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <div className="sbj-edit-tag-input-wrap">
      <input
        className="sbj-edit-tag-input"
        placeholder="# 추가"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {open && (available.length > 0 || query.trim()) && (
        <div className="sbj-edit-tag-suggestions">
          {available.map((t) => (
            <button
              key={t.idx}
              className="sbj-edit-tag-suggestion"
              onPointerDown={() => applyExisting(t.idx)}
            >
              {t.title || "—"}
            </button>
          ))}
          {query.trim() && !tagTypes.find((t) => t.title === query.trim()) && (
            <button
              className="sbj-edit-tag-suggestion -new"
              onPointerDown={createAndApply}
            >
              '{query.trim()}' 새 태그로 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Edit Form ─────────────────────────────────────────────────────────────────

type FormProps = {
  idx: number;
  info: Fields;
  spc: number;
  closeEdit: () => void;
  updateSbj: (idx: number, fields: Fields) => void;
  tagTypes: TagType[];
  spcTypes: SpeciesType[];
  idx2tag: ReadonlyMap<number, Set<number>>;
  addTagType: () => number;
  renameTagType: (idx: number, title: string) => void;
  toggleTag: (itemIdx: number, tagIdx: number) => void;
  setSpc: (targetSet: ReadonlySet<number>, spcIdx: number) => void;
};

const SbjEditForm = ({ idx, info, spc, closeEdit, updateSbj, tagTypes, spcTypes, idx2tag, addTagType, renameTagType, toggleTag, setSpc }: FormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftShort, setDraftShort] = useState("");
  // Use refs — avoids re-render on every keystroke
  const titleRef = useRef(info.title);
  const contentRef = useRef(info.content);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isEditing) closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeEdit, isEditing]);

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

  const tagSet = idx2tag.get(idx);

  return (
    <Popup className="sbj-edit-overlay" onClose={closeEdit}>
      <div className="sbj-edit-modal">
        {isEditing ? (
          <>
            <div className="sbj-edit-row -top">
              <label>제목</label>
              <TextEditor
                value={info.title}
                onChange={onTitleChange}
                maxLines={3}
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
        <div className="sbj-edit-row">
          <label>분류</label>
          <select
            className="sbj-edit-spc-select"
            value={spc}
            onChange={(e) => setSpc(new Set([idx]), Number(e.target.value))}
          >
            {spcTypes.map((s) => (
              <option key={s.idx} value={s.idx}>
                {s.title || `분류 ${s.idx}`}
              </option>
            ))}
          </select>
        </div>
        <div className="sbj-edit-row">
          <label>태그</label>
          <div className="sbj-edit-tags">
            {tagSet && [...tagSet].map((tagIdx) => {
              const t = tagTypes.find((x) => x.idx === tagIdx);
              if (!t) return null;
              return (
                <span key={tagIdx} className="sbj-edit-tag-chip">
                  {t.title || "—"}
                  <button
                    className="sbj-edit-tag-chip-x"
                    onPointerDown={() => toggleTag(idx, tagIdx)}
                  >×</button>
                </span>
              );
            })}
            <TagHashInput
              idx={idx}
              tagTypes={tagTypes}
              tagSet={tagSet}
              addTagType={addTagType}
              renameTagType={renameTagType}
              toggleTag={toggleTag}
            />
          </div>
        </div>
      </div>
    </Popup>
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
      if (e.key === "Escape" && !isEditing) closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeEdit, isEditing]);

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
    <Popup className="sbj-edit-overlay" onClose={closeEdit}>
      <div className="sbj-edit-modal">
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
    </Popup>
  );
};

// ── Modal wrapper ─────────────────────────────────────────────────────────────

const SbjEditModal = () => {
  const { editingIdx, closeEdit, updateSbj, updateCrs, idx2sbj, tagTypes, spcTypes, idx2tag, addTagType, renameTagType, toggleTag, setSpc } = useSbjData();
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
      spc={info.spc ?? DEFAULT_SPC_IDX}
      closeEdit={closeEdit}
      updateSbj={updateSbj}
      tagTypes={tagTypes}
      spcTypes={spcTypes}
      idx2tag={idx2tag}
      addTagType={addTagType}
      renameTagType={renameTagType}
      toggleTag={toggleTag}
      setSpc={setSpc}
    />
  );
};

export default SbjEditModal;
