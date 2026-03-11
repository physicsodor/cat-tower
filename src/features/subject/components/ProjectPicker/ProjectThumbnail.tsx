import { useMemo } from "react";
import { decodeList } from "../../types/Curriculum/curriculumCodec";
import type { Curriculum } from "../../types/Curriculum/Curriculum";

type Props = { data: string };

const W = 200;
const H = 130;
const PAD = 14;

export const ProjectThumbnail = ({ data }: Props) => {
  const subjects = useMemo(() => {
    const list = decodeList(data);
    return list.filter(
      (c): c is Extract<Curriculum, { sbjType: "SUBJECT" }> => c.sbjType === "SUBJECT"
    );
  }, [data]);

  if (subjects.length === 0) {
    return (
      <div className="proj-thumb-empty">
        <span>비어 있음</span>
      </div>
    );
  }

  const xs = subjects.map((s) => s.x);
  const ys = subjects.map((s) => s.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const sx = (x: number) => PAD + ((x - minX) / rangeX) * (W - 2 * PAD);
  const sy = (y: number) => PAD + ((y - minY) / rangeY) * (H - 2 * PAD);

  // prerequisite lines
  const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  for (const s of subjects) {
    for (const preIdx of s.pre) {
      const pre = subjects.find((p) => p.idx === preIdx);
      if (pre) {
        lines.push({
          x1: sx(pre.x),
          y1: sy(pre.y),
          x2: sx(s.x),
          y2: sy(s.y),
          key: `${preIdx}-${s.idx}`,
        });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="proj-thumb-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      {lines.map(({ key, ...l }) => (
        <line key={key} {...l} stroke="var(--C-D)" strokeWidth="1.5" opacity="0.6" />
      ))}
      {subjects.map((s) => (
        <circle key={s.idx} cx={sx(s.x)} cy={sy(s.y)} r="4" fill="var(--C-B)" />
      ))}
    </svg>
  );
};
