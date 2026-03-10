import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSbjData } from "../context/SbjDataContext";
import {
  renderMarkup, markupToHtml, htmlToMarkup,
  limitBytes, countBytes, renderLatex, updateMathBlock,
} from "../utils/markup";

type Fields = { title: string; short?: string; content: string; description: string };
type MathKind = "math" | "dmath";

// ── Math Editor Popup ─────────────────────────────────────────────────────────

type MathEditState =
  | { mode: "edit";   el: HTMLElement; kind: MathKind; latex: string }
  | { mode: "insert"; kind: MathKind; savedRange: Range };

const MathEditorPopup = ({
  state,
  onCancel,
  onConfirm,
}: {
  state: MathEditState;
  onCancel: () => void;
  onConfirm: (latex: string, kind: MathKind) => void;
}) => {
  const [draft, setDraft] = useState(state.mode === "edit" ? state.latex : "");
  const [kind, setKind] = useState<MathKind>(state.kind);
  const display = kind === "dmath";

  return createPortal(
    <div className="math-edit-overlay" onPointerDown={onCancel}>
      <div className="math-edit-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="math-edit-kind-toggle">
          <button className={`math-kind-btn${kind === "math" ? " -active" : ""}`} onClick={() => setKind("math")}>inline</button>
          <button className={`math-kind-btn${kind === "dmath" ? " -active" : ""}`} onClick={() => setKind("dmath")}>display</button>
        </div>
        <div className="math-edit-preview">
          {draft
            ? <span dangerouslySetInnerHTML={{ __html: renderLatex(draft, display) }} />
            : <span className="math-placeholder">(수식)</span>}
        </div>
        <textarea
          className="math-edit-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="LaTeX 수식을 입력하세요 (예: x^2 + y^2 = r^2)"
          autoFocus
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onConfirm(draft, kind); }
            if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
          }}
        />
        <div className="sbj-edit-btns">
          <button className="sbj-edit-btn" onClick={onCancel}>취소</button>
          <button className="sbj-edit-btn -confirm" onClick={() => onConfirm(draft, kind)}>확인</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── WYSIWYG Markup Editor ─────────────────────────────────────────────────────

const TOOLS: { cmd: string; label: React.ReactNode; title: string }[] = [
  { cmd: "bold",        label: <strong>B</strong>,             title: "Bold" },
  { cmd: "italic",      label: <em>I</em>,                     title: "Italic" },
  { cmd: "subscript",   label: <span>x<sub>2</sub></span>,     title: "Subscript" },
  { cmd: "superscript", label: <span>x<sup>2</sup></span>,     title: "Superscript" },
  { cmd: "math",        label: <span>∑</span>,                 title: "수식" },
];

const MarkupEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [mathEdit, setMathEdit] = useState<MathEditState | null>(null);

  // Set initial HTML once on mount (uncontrolled after that)
  useEffect(() => {
    if (divRef.current) divRef.current.innerHTML = markupToHtml(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncMarkup = useCallback(() => {
    if (divRef.current) onChange(htmlToMarkup(divRef.current.innerHTML));
  }, [onChange]);

  // Returns the element to insert into the DOM.
  // For dmath: a full-width editable wrapper containing the non-editable math span.
  // For math: the non-editable math span directly.
  const buildMathEl = (kind: MathKind, latex: string): HTMLElement => {
    const inner = document.createElement("span");
    inner.contentEditable = "false";
    inner.className = kind === "dmath" ? "math-block -display" : "math-block";
    inner.dataset.kind = kind;
    inner.dataset.latex = latex;
    inner.innerHTML = latex
      ? renderLatex(latex, kind === "dmath")
      : `<span class="math-placeholder">(수식)</span>`;
    if (kind === "dmath") {
      const wrapper = document.createElement("span");
      wrapper.className = "dmath-line";
      wrapper.appendChild(inner);
      return wrapper;
    }
    return inner;
  };

  const handleMathConfirm = useCallback((latex: string, kind: MathKind) => {
    if (!mathEdit || !divRef.current) return;

    if (mathEdit.mode === "edit") {
      if (kind !== mathEdit.kind) {
        // Kind changed (inline ↔ display): find the outermost element to replace.
        // dmath has a .dmath-line wrapper; inline math is just the span itself.
        const replaceTarget = mathEdit.el.parentElement?.classList.contains("dmath-line")
          ? mathEdit.el.parentElement
          : mathEdit.el;
        replaceTarget.replaceWith(buildMathEl(kind, latex));
      } else {
        updateMathBlock(mathEdit.el, latex);
      }
    } else {
      // Insert new math block at saved cursor position
      const { savedRange } = mathEdit;
      const el = buildMathEl(kind, latex);

      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange);
      const range = sel?.getRangeAt(0);
      if (range) {
        range.deleteContents();
        range.insertNode(el);
        range.setStartAfter(el);
        range.setEndAfter(el);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }

    syncMarkup();
    setMathEdit(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mathEdit, syncMarkup]);

  const exec = useCallback((cmd: string) => {
    const div = divRef.current;
    if (!div) return;
    if (cmd === "math") {
      div.focus();
      const sel = window.getSelection();
      const savedRange = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      if (savedRange) setMathEdit({ mode: "insert", kind: "math", savedRange });
    } else {
      div.focus();
      document.execCommand(cmd, false);
      syncMarkup();
    }
  }, [syncMarkup]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".math-block") as HTMLElement | null;
    if (target) {
      setMathEdit({
        mode: "edit",
        el: target,
        kind: (target.dataset.kind ?? "math") as MathKind,
        latex: target.dataset.latex ?? "",
      });
    }
  }, []);

  return (
    <div className="markup-editor">
      <div className="markup-editor-toolbar">
        {TOOLS.map(({ cmd, label, title }) => (
          <button
            key={cmd}
            type="button"
            className="markup-editor-btn"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={divRef}
        className="markup-editor-body"
        contentEditable
        suppressContentEditableWarning
        onInput={syncMarkup}
        onClick={handleClick}
      />
      {mathEdit && (
        <MathEditorPopup
          state={mathEdit}
          onCancel={() => setMathEdit(null)}
          onConfirm={handleMathConfirm}
        />
      )}
    </div>
  );
};

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

  // Stable callback — never causes MarkupEditor re-renders
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
              <MarkupEditor value={info.content} onChange={onContentChange} />
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
