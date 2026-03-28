import type { Style } from "mathlive";

const STYLE_TOOLBAR: {
  id: string;
  label: React.ReactNode;
  title: string;
  style: Readonly<Style>;
}[] = [
  {
    id: "bold",
    label: <strong>B</strong>,
    title: "Bold (\\mathbf)",
    style: { variant: "normal", variantStyle: "bold" },
  },
  {
    id: "roman",
    label: "R",
    title: "Roman (\\mathrm)",
    style: { variant: "normal", variantStyle: "up" },
  },
  {
    id: "script",
    label: "𝒮",
    title: "Script (\\mathscr)",
    style: { variant: "script" },
  },
  {
    id: "fraktur",
    label: "𝔉",
    title: "Fraktur (\\mathfrak)",
    style: { variant: "fraktur" },
  },
  {
    id: "blackboard",
    label: "𝔹",
    title: "Blackboard (\\mathbb)",
    style: { variant: "double-struck" },
  },
];

export { STYLE_TOOLBAR };
