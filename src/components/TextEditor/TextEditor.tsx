import { useCallback, useEffect, useRef, useState } from "react";
import {
  markupToHtml, htmlToMarkup, updateMathBlock, buildMathEl,
} from "./markup";
import MathEditorPopup, { type MathKind, type MathEditState } from "./MathEditorPopup";
import "./TextEditor.scss";

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
