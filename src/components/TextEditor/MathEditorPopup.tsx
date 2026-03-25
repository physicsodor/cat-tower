import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { renderLatex } from "./markup";
import { Toggle } from "../Toggle/Toggle";

export type MathKind = "math" | "dmath";

export type MathEditState =
  | { mode: "edit"; el: HTMLElement; kind: MathKind; latex: string }
  | { mode: "insert"; kind: MathKind; savedRange: Range };

const PREVIEW_DELAY = 200;

const MathEditorPopup = ({
  state,
  onCancel,
  onConfirm,
  inlineOnly,
}: {
  state: MathEditState;
  onCancel: () => void;
  onConfirm: (latex: string, kind: MathKind) => void;
  inlineOnly?: boolean;
}) => {
  const initialLatex = state.mode === "edit" ? state.latex : "";
  const [draft, setDraft] = useState(initialLatex);
  const [preview, setPreview] = useState(initialLatex);
  const [kind, setKind] = useState<MathKind>(inlineOnly ? "math" : state.kind);
  const display = kind === "dmath";

  useEffect(() => {
    const id = setTimeout(() => setPreview(draft), PREVIEW_DELAY);
    return () => clearTimeout(id);
  }, [draft]);

  return createPortal(
    <div className="math-edit-overlay" onPointerDown={onCancel}>
      <div className="math-edit-modal" onPointerDown={(e) => e.stopPropagation()}>
        {!inlineOnly && (
          <div className="math-edit-kind-toggle">
            <Toggle
              offLabel="inline"
              onLabel="display"
              defaultOn={kind === "dmath"}
              onChange={(on) => setKind(on ? "dmath" : "math")}
            />
          </div>
        )}
        <div className="math-edit-preview">
          {preview
            ? <span dangerouslySetInnerHTML={{ __html: renderLatex(preview, display) }} />
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

export default MathEditorPopup;
