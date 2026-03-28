import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { type Style, MathfieldElement } from "mathlive";
import { SYMBOL_CATS } from "./symbolCats";
import "./MathEditor.scss";
import { STYLE_TOOLBAR } from "./styleToolbar";

export interface MathEditorHandle {
  getValue: () => string;
}

// ── Brackets ───────────────────────────────────────────────────────────────────

const BRACKET_ITEMS: { label: string; latex: string; title: string }[] = [
  // 대칭 괄호
  { label: "()",   latex: "\\left(#?\\right)",              title: "괄호 ( )" },
  { label: "[]",   latex: "\\left[#?\\right]",              title: "대괄호 [ ]" },
  { label: "{}",   latex: "\\left\\{#?\\right\\}",          title: "중괄호 { }" },
  { label: "||",   latex: "\\left|#?\\right|",              title: "절댓값 | |" },
  { label: "‖‖",  latex: "\\left\\|#?\\right\\|",          title: "노름 ‖ ‖" },
  { label: "⟨⟩",  latex: "\\left\\langle#?\\right\\rangle", title: "꺾쇠 ⟨ ⟩" },
  { label: "⌊⌋",  latex: "\\left\\lfloor#?\\right\\rfloor", title: "내림 ⌊ ⌋" },
  { label: "⌈⌉",  latex: "\\left\\lceil#?\\right\\rceil",  title: "올림 ⌈ ⌉" },
  // 비대칭 (bra-ket)
  { label: "⟨|",  latex: "\\left\\langle#?\\right|",        title: "Bra ⟨·|" },
  { label: "|⟩",  latex: "\\left|#?\\right\\rangle",        title: "Ket |·⟩" },
  { label: "⟨|⟩", latex: "\\left\\langle#?\\middle|#?\\right\\rangle", title: "Braket ⟨·|·⟩" },
  // 한쪽만 (왼쪽 열림)
  { label: "( ·",  latex: "\\left(#?\\right.",              title: "왼쪽 괄호만" },
  { label: "[ ·",  latex: "\\left[#?\\right.",              title: "왼쪽 대괄호만" },
  { label: "{ ·",  latex: "\\left\\{#?\\right.",            title: "왼쪽 중괄호만" },
  // 한쪽만 (오른쪽 닫힘)
  { label: "· )",  latex: "\\left.#?\\right)",              title: "오른쪽 괄호만" },
  { label: "· ]",  latex: "\\left.#?\\right]",              title: "오른쪽 대괄호만" },
  { label: "· }",  latex: "\\left.#?\\right\\}",            title: "오른쪽 중괄호만" },
];

// ── Matrix ─────────────────────────────────────────────────────────────────────

const MATRIX_BRACKETS = [
  { id: "matrix",  label: "·",    title: "No brackets" },
  { id: "pmatrix", label: "(·)",  title: "Parentheses ( )" },
  { id: "bmatrix", label: "[·]",  title: "Brackets [ ]" },
  { id: "Bmatrix", label: "{·}",  title: "Braces { }" },
  { id: "vmatrix", label: "|·|",  title: "Vertical bars | |" },
  { id: "Vmatrix", label: "‖·‖", title: "Double bars ‖ ‖" },
];

const MATRIX_OPS = [
  { cmd: "addRowBefore",    label: "+row↑", title: "Add row above" },
  { cmd: "addRowAfter",     label: "+row↓", title: "Add row below" },
  { cmd: "removeRow",       label: "−row",  title: "Remove current row" },
  { cmd: "addColumnBefore", label: "+col←", title: "Add column left" },
  { cmd: "addColumnAfter",  label: "+col→", title: "Add column right" },
  { cmd: "removeColumn",    label: "−col",  title: "Remove current column" },
];

const MATRIX_MAX = 6;

// ── Component ──────────────────────────────────────────────────────────────────

const MathEditor = forwardRef<
  MathEditorHandle,
  { initialLatex: string; onConfirm?: (latex: string) => void }
>(({ initialLatex, onConfirm }, ref) => {
  const mfRef = useRef<HTMLElement>(null);
  const [activeSet, setActiveSet] = useState<ReadonlySet<string>>(new Set());
  const [debugLatex, setDebugLatex] = useState(initialLatex);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [matrixBracket, setMatrixBracket] = useState("pmatrix");
  const [matrixHover, setMatrixHover] = useState<{
    r: number;
    c: number;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => (mfRef.current as MathfieldElement | null)?.value ?? "",
  }));

  const updateActive = useCallback(() => {
    const mf = mfRef.current as MathfieldElement | null;
    if (!mf) return;
    const next = new Set<string>();
    for (const { id, style } of STYLE_TOOLBAR) {
      if (mf.queryStyle(style) === "all") next.add(id);
    }
    setActiveSet(next);
  }, []);

  useEffect(() => {
    const mf = mfRef.current as MathfieldElement | null;
    if (!mf) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mf as any).menuItems = [];
    mf.smartFence = false;
    mf.value = initialLatex;
    mf.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onConfirm?.((mfRef.current as MathfieldElement | null)?.value ?? "");
      }
    };
    const handleInput = () =>
      setDebugLatex((mfRef.current as MathfieldElement | null)?.value ?? "");
    mf.addEventListener("keydown", handleKeyDown);
    mf.addEventListener("selection-change", updateActive);
    mf.addEventListener("input", handleInput);
    return () => {
      mf.removeEventListener("keydown", handleKeyDown);
      mf.removeEventListener("selection-change", updateActive);
      mf.removeEventListener("input", handleInput);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mf = () => mfRef.current as MathfieldElement | null;

  const toggleStyle = (style: Readonly<Style>) => {
    mf()?.applyStyle(style, { operation: "toggle" });
    mf()?.focus();
    updateActive();
  };

  const insertSymbol = (latex: string) => {
    mf()?.insert(latex, { selectionMode: "after" });
    mf()?.focus();
    setOpenPanel(null);
  };

  const insertBracket = (latex: string) => {
    mf()?.insert(latex, { selectionMode: "placeholder" });
    mf()?.focus();
    setOpenPanel(null);
  };

  const insertMatrix = (rows: number, cols: number) => {
    const rowArr = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => "#?").join(" & "),
    );
    const latex = `\\begin{${matrixBracket}} ${rowArr.join(" \\\\ ")} \\end{${matrixBracket}}`;
    mf()?.insert(latex, { selectionMode: "placeholder" });
    mf()?.focus();
    setOpenPanel(null);
    setMatrixHover(null);
  };

  const execMatrixOp = (cmd: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mf() as any)?.executeCommand(cmd);
    mf()?.focus();
  };

  const togglePanel = (id: string) =>
    setOpenPanel((prev) => (prev === id ? null : id));

  return (
    <div className="math-editor">
      {/* Row 1: Brackets + Matrix */}
      <div className="math-editor-toolbar-row">
        {/* Bracket panel */}
        <div className="math-editor-dropdown">
          <button
            type="button"
            className={`math-editor-btn${openPanel === "bracket" ? " -active" : ""}`}
            title="괄호"
            onMouseDown={(e) => {
              e.preventDefault();
              togglePanel("bracket");
            }}
          >
            ()
          </button>
          {openPanel === "bracket" && (
            <div className="math-editor-bracket-panel">
              {BRACKET_ITEMS.map(({ label, latex, title }) => (
                <button
                  key={latex}
                  type="button"
                  className="math-editor-bracket-btn"
                  title={title}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertBracket(latex);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Matrix panel */}
        <div className="math-editor-dropdown">
          <button
            type="button"
            className={`math-editor-btn${openPanel === "matrix" ? " -active" : ""}`}
            title="Matrix"
            onMouseDown={(e) => {
              e.preventDefault();
              togglePanel("matrix");
            }}
          >
            ⊞
          </button>
          {openPanel === "matrix" && (
            <div className="math-editor-matrix-panel">
              <div className="math-editor-matrix-brackets">
                {MATRIX_BRACKETS.map(({ id, label, title }) => (
                  <button
                    key={id}
                    type="button"
                    className={`math-editor-matrix-bracket-btn${matrixBracket === id ? " -active" : ""}`}
                    title={title}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setMatrixBracket(id);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="math-editor-matrix-grid-label">
                {matrixHover
                  ? `${matrixHover.r} × ${matrixHover.c}`
                  : "크기 선택"}
              </div>
              <div
                className="math-editor-matrix-grid"
                onMouseLeave={() => setMatrixHover(null)}
              >
                {Array.from({ length: MATRIX_MAX }, (_, ri) =>
                  Array.from({ length: MATRIX_MAX }, (_, ci) => {
                    const r = ri + 1,
                      c = ci + 1;
                    const active =
                      matrixHover && r <= matrixHover.r && c <= matrixHover.c;
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`math-editor-matrix-cell${active ? " -active" : ""}`}
                        onMouseEnter={() => setMatrixHover({ r, c })}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertMatrix(r, c);
                        }}
                      />
                    );
                  }),
                )}
              </div>
              <div className="math-editor-matrix-sep" />
              <div className="math-editor-matrix-ops">
                {MATRIX_OPS.map(({ cmd, label, title }) => (
                  <button
                    key={cmd}
                    type="button"
                    className="math-editor-matrix-op-btn"
                    title={title}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      execMatrixOp(cmd);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Symbol categories */}
      <div className="math-editor-toolbar-row">
        {SYMBOL_CATS.map(({ id, label, title, symbols }) => (
          <div key={id} className="math-editor-dropdown">
            <button
              type="button"
              className={`math-editor-btn${openPanel === id ? " -active" : ""}`}
              title={title}
              onMouseDown={(e) => {
                e.preventDefault();
                togglePanel(id);
              }}
            >
              {label}
            </button>
            {openPanel === id && (
              <div className="math-editor-symbol-panel">
                {symbols.map(({ d, l }, i) => (
                  <button
                    key={i}
                    type="button"
                    className="math-editor-symbol-btn"
                    title={l}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertSymbol(l);
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 3: Style */}
      <div className="math-editor-toolbar-row">
        {STYLE_TOOLBAR.map(({ id, label, title, style }) => (
          <button
            key={id}
            type="button"
            className={`math-editor-btn${activeSet.has(id) ? " -active" : ""}`}
            title={title}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleStyle(style);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <math-field ref={mfRef} className="math-edit-field" />
      <pre className="math-editor-debug-latex">{debugLatex}</pre>
    </div>
  );
});

MathEditor.displayName = "MathEditor";
export default MathEditor;
