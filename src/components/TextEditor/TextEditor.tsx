import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  renderLatex, markupToHtml, htmlToMarkup, updateMathBlock,
} from "./markup";
import "./TextEditor.scss";

type MathKind = "math" | "dmath";

type MathEditState =
  | { mode: "edit";   el: HTMLElement; kind: MathKind; latex: string }
  | { mode: "insert"; kind: MathKind; savedRange: Range };

// ── Math block DOM builder ────────────────────────────────────────────────────

function buildMathEl(kind: MathKind, latex: string): HTMLElement {
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
}

// ── Math Editor Popup ─────────────────────────────────────────────────────────

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
        <div className="te-btns">
          <button className="te-btn" onClick={onCancel}>취소</button>
          <button className="te-btn -confirm" onClick={() => onConfirm(draft, kind)}>확인</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Toolbar definition ────────────────────────────────────────────────────────

const TOOLS: { cmd: string; label: React.ReactNode; title: string }[] = [
  { cmd: "bold",        label: <strong>B</strong>,             title: "Bold" },
  { cmd: "italic",      label: <em>I</em>,                     title: "Italic" },
  { cmd: "subscript",   label: <span>x<sub>2</sub></span>,     title: "Subscript" },
  { cmd: "superscript", label: <span>x<sup>2</sup></span>,     title: "Superscript" },
  { cmd: "math",        label: <span>∑</span>,                 title: "수식" },
];

// ── TextEditor ────────────────────────────────────────────────────────────────

/**
 * WYSIWYG markup editor with KaTeX math support.
 *
 * Props:
 *   value    — markup string (read once on mount; uncontrolled after)
 *   onChange — called with updated markup string on every edit
 *
 * Dependencies: react, react-dom, katex
 * Self-contained: import TextEditor + TextEditor.scss (auto-imported here)
 */
const TextEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
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

  const handleMathConfirm = useCallback((latex: string, kind: MathKind) => {
    if (!mathEdit || !divRef.current) return;

    if (mathEdit.mode === "edit") {
      if (kind !== mathEdit.kind) {
        // Kind changed (inline ↔ display): replace the outermost element.
        // dmath has a .dmath-line wrapper; inline math is the span itself.
        const replaceTarget = mathEdit.el.parentElement?.classList.contains("dmath-line")
          ? mathEdit.el.parentElement
          : mathEdit.el;
        replaceTarget.replaceWith(buildMathEl(kind, latex));
      } else {
        updateMathBlock(mathEdit.el, latex);
      }
    } else {
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

export default TextEditor;
