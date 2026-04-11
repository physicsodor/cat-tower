import type { Curriculum } from "@/lib/Curriculum/curriculum";

export function buildExampleCurriculum(): Curriculum[] {
  return [
    {
      idx: 1,
      mom: -1,
      bro: "a0",
      pre: new Set(),
      title: "예시 과목 A",
      content: "여기에 과목 설명을 입력하세요.",
      x: -270,
      y: 0,
      sbjType: "SUBJECT",
      tag: new Set(),
    },
    {
      idx: 2,
      mom: -1,
      bro: "a1",
      pre: new Set([1]),
      title: "예시 과목 B",
      content: "선수 과목이 있는 예시입니다.",
      x: 0,
      y: 0,
      sbjType: "SUBJECT",
      tag: new Set(),
    },
    {
      idx: 3,
      mom: -1,
      bro: "a2",
      pre: new Set([2]),
      title: "예시 과목 C",
      content: "여러 과목을 연결할 수 있습니다.",
      x: 270,
      y: 0,
      sbjType: "SUBJECT",
      tag: new Set(),
    },
  ];
}
