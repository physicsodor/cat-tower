import { useEffect, useRef, useState } from "react";
import { MathfieldElement } from "mathlive";
import { Toggle } from "../Toggle/Toggle";
import { Popup } from "../Popup/Popup";


export type MathKind = "math" | "dmath";

export type MathEditState =
  | { mode: "edit"; el: HTMLElement; kind: MathKind; latex: string }
  | { mode: "insert"; kind: MathKind; savedRange: Range };

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
  const [kind, setKind] = useState<MathKind>(inlineOnly ? "math" : state.kind);
  const kindRef = useRef(kind);
  const mfRef = useRef<HTMLElement>(null);

  useEffect(() => { kindRef.current = kind; }, [kind]);

  useEffect(() => {
    const mf = mfRef.current as MathfieldElement | null;
    if (!mf) return;
    mf.value = initialLatex;
    mf.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onConfirm(mf.value, kindRef.current);
      }
    };
    mf.addEventListener("keydown", handleKeyDown);
    return () => mf.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = () => onConfirm((mfRef.current as MathfieldElement | null)?.value ?? "", kind);

  return (
    <Popup className="math-edit-overlay" onClose={onCancel}>
      <div className="math-edit-modal">
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
        <math-field ref={mfRef} className="math-edit-field" />
        <div className="te-btns">
          <button className="te-btn" onClick={onCancel}>취소</button>
          <button className="te-btn -confirm" onClick={confirm}>확인</button>
        </div>
      </div>
    </Popup>
  );
};

export default MathEditorPopup;
