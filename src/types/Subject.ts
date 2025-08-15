export type Subject = {
  idx: number;
  ttl: string;
  cnt: string;
  dsc: string;
  mom: number;
};

export const DefSbj = (i: number, m = -1): Subject => ({
  idx: i,
  ttl: "",
  cnt: "",
  dsc: "",
  mom: m,
});
