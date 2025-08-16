export type Course = {
  idx: number;
  ttl: string;
  mom: number;
};

export const DefCrs = (i = 0, m = -1): Course => ({
  idx: i,
  ttl: `Course ${i}`,
  mom: m,
});
