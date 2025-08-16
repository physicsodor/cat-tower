export type Subject = {
  idx: number;
  ttl: string;
  cnt: string;
  dsc: string;
  mom: number;
};

export const DefSbj = (i = 0, m = -1): Subject => ({
  idx: i,
  ttl: `Subject ${i}`,
  cnt: "",
  dsc: "",
  mom: m,
});
