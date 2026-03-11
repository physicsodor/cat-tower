import { useState } from "react";
import { createPortal } from "react-dom";
import { renderLatex } from "./markup";

export type MathKind = "math" | "dmath";

export type MathEditState =
  | { mode: "edit"; el: HTMLElement; kind: MathKind; latex: string }
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
