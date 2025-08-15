export type Subject = {
  idx: number;
  ttl: string;
  cnt: string;
  dsc: string;
};

export const DefSbj = (i: number): Subject => ({
  idx: i,
  ttl: "",
  cnt: "",
  dsc: "",
});
