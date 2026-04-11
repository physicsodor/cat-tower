export type BBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  l: number;
  r: number;
  t: number;
  b: number;
};

export const bboxFromLRTB = (
  l: number,
  r: number,
  t: number,
  b: number,
): BBox => ({
  l,
  r,
  t,
  b,
  x: (l + r) / 2,
  y: (t + b) / 2,
  w: r - l,
  h: b - t,
});

export const bboxFromXYWH = (
  x: number,
  y: number,
  w: number,
  h: number,
): BBox => ({
  x,
  y,
  w,
  h,
  l: x - w / 2,
  r: x + w / 2,
  t: y - h / 2,
  b: y + h / 2,
});
