import { createElement, Fragment, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Supported tags: \bf{...} \if{...} \sub{...} \sup{...} \math{...} \dmath{...}
type TagKind = "bf" | "if" | "sub" | "sup" | "math" | "dmath";
type MNode = { kind: "text"; value: string } | { kind: TagKind; children: MNode[] };

const TAG_RE = /^\\(bf|if|sub|sup|math|dmath)\{/;

function parseNodes(s: string): MNode[] {
  const nodes: MNode[] = [];
  let i = 0;
  let textStart = 0;

  const flush = (end: number) => {
    if (end > textStart) nodes.push({ kind: "text", value: s.slice(textStart, end) });
  };

  while (i < s.length) {
    if (s[i] === "\\") {
      const m = s.slice(i).match(TAG_RE);
      if (m) {
        flush(i);
        const tag = m[1] as TagKind;
        let j = i + m[0].length;
        let depth = 1;
        while (j < s.length && depth > 0) {
          if (s[j] === "{") depth++;
          else if (s[j] === "}") depth--;
          if (depth > 0) j++;
        }
        const inner = s.slice(i + m[0].length, j);
        // Math nodes: content is raw LaTeX, not recursive markup
        const children: MNode[] = (tag === "math" || tag === "dmath")
          ? [{ kind: "text", value: inner }]
          : parseNodes(inner);
        nodes.push({ kind: tag, children });
        i = j + 1;
        textStart = i;
        continue;
      }
    }
    i++;
  }

  flush(s.length);
  return nodes;
}

// ── React rendering (with \n → <br>) ─────────────────────────────────────────

function toReact(nodes: MNode[], prefix: string): ReactNode[] {
  return nodes.flatMap((n, i) => {
    const key = `${prefix}${i}`;
    if (n.kind === "text") {
      const parts = n.value.split("\n");
      return parts.flatMap((p, j) =>
        j < parts.length - 1
          ? [p, createElement("br", { key: `${key}_br${j}` })]
          : [p]
      );
    }
    if (n.kind === "math" || n.kind === "dmath") {
      const latex = (n.children[0] as { kind: "text"; value: string })?.value ?? "";
      const display = n.kind === "dmath";
      const html = katex.renderToString(latex, { throwOnError: false, output: "html", displayMode: display });
      const tag = display ? "div" : "span";
      return [createElement(tag, { key, dangerouslySetInnerHTML: { __html: html } })];
    }
    const ch = toReact(n.children, `${key}_`);
    switch (n.kind) {
      case "bf":  return [createElement("strong", { key }, ...ch)];
      case "if":  return [createElement("em",     { key }, ...ch)];
      case "sub": return [createElement("sub",    { key }, ...ch)];
      case "sup": return [createElement("sup",    { key }, ...ch)];
    }
  });
}

export const renderMarkup = (s: string): ReactNode =>
  createElement(Fragment, null, ...toReact(parseNodes(s), ""));

// ── Strip to plain text ───────────────────────────────────────────────────────

function stripNodes(nodes: MNode[]): string {
  return nodes
    .map((n) => {
      if (n.kind === "text") return n.value.replace(/\n/g, " ");
      if (n.kind === "math" || n.kind === "dmath") return ""; // omit LaTeX from plain text
      return stripNodes(n.children);
    })
    .join("");
}

export const stripMarkup = (s: string): string => stripNodes(parseNodes(s));

// ── Shared byte utilities (UTF-16) ────────────────────────────────────────────

/** UTF-16 byte count: each code unit = 2 bytes (surrogate pairs = 4 bytes). */
export const countBytes = (s: string): number => s.length * 2;

/** Hard-limit string to max UTF-16 bytes (no suffix). */
export const limitBytes = (v: string, max: number): string => {
  let bytes = 0;
  let result = "";
  for (const char of v) {
    const b = char.length * 2;
    if (bytes + b > max) break;
    bytes += b;
    result += char;
  }
  return result;
};

/** Truncate to max UTF-16 bytes, appending suffix if truncated. */
export const truncateBytes = (v: string, max: number, suffix = ""): string => {
  if (v.length * 2 <= max) return v;
  let bytes = 0;
  let result = "";
  for (const char of v) {
    const b = char.length * 2;
    if (bytes + b > max) break;
    bytes += b;
    result += char;
  }
  return result + suffix;
};

// ── KaTeX render helper ───────────────────────────────────────────────────────

export const renderLatex = (latex: string, displayMode: boolean): string =>
  katex.renderToString(latex, { throwOnError: false, output: "html", displayMode });

// ── Math block DOM builder ────────────────────────────────────────────────────

type MathKind = "math" | "dmath";

export const buildMathEl = (kind: MathKind, latex: string): HTMLElement => {
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

// ── Markup ↔ HTML (for contentEditable WYSIWYG) ───────────────────────────────

function mathBlockHtml(kind: "math" | "dmath", latex: string): string {
  const display = kind === "dmath";
  const inner = latex
    ? renderLatex(latex, display)
    : `<span class="math-placeholder">(수식)</span>`;
  const escapedLatex = latex.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const cls = display ? "math-block -display" : "math-block";
  const mathSpan = `<span contenteditable="false" class="${cls}" data-kind="${kind}" data-latex="${escapedLatex}">${inner}</span>`;
  return display ? `<span class="dmath-line">${mathSpan}</span>` : mathSpan;
}

export const updateMathBlock = (el: HTMLElement, latex: string): void => {
  const kind = (el.dataset.kind ?? "math") as "math" | "dmath";
  el.dataset.latex = latex;
  el.innerHTML = latex
    ? renderLatex(latex, kind === "dmath")
    : `<span class="math-placeholder">(수식)</span>`;
};

function nodeToHtml(n: MNode): string {
  if (n.kind === "text") {
    return n.value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }
  if (n.kind === "math" || n.kind === "dmath") {
    const latex = (n.children[0] as { kind: "text"; value: string })?.value ?? "";
    return mathBlockHtml(n.kind, latex);
  }
  const inner = n.children.map(nodeToHtml).join("");
  switch (n.kind) {
    case "bf":  return `<strong>${inner}</strong>`;
    case "if":  return `<em>${inner}</em>`;
    case "sub": return `<sub>${inner}</sub>`;
    case "sup": return `<sup>${inner}</sup>`;
  }
}

export const markupToHtml = (s: string): string => parseNodes(s).map(nodeToHtml).join("");

function domNodeToMarkup(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;

  // Math blocks — reconstruct from data attributes
  if (el.classList.contains("math-block")) {
    const kind = el.dataset.kind ?? "math";
    const latex = el.dataset.latex ?? "";
    return `\\${kind}{${latex}}`;
  }

  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes);

  if (tag === "br") return "\n";

  // Block elements (contentEditable line wrappers)
  if (tag === "div" || tag === "p") {
    const prefix = el.previousSibling ? "\n" : "";
    // Sole <br> inside a block = empty line placeholder, no extra newline
    if (children.length === 1 && (children[0] as HTMLElement).tagName?.toLowerCase() === "br") {
      return prefix;
    }
    return prefix + children.map(domNodeToMarkup).join("");
  }

  const inner = children.map(domNodeToMarkup).join("");
  switch (tag) {
    case "b": case "strong": return `\\bf{${inner}}`;
    case "i": case "em":     return `\\if{${inner}}`;
    case "sub":              return `\\sub{${inner}}`;
    case "sup":              return `\\sup{${inner}}`;
    default:                 return inner;
  }
}

export const htmlToMarkup = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return Array.from(tmp.childNodes).map(domNodeToMarkup).join("").trimEnd();
};
