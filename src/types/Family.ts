export interface Family {
  idx: number;
  mom: number;
}

export const DefFam = (i = 0, m = -1): Family => ({
  idx: i,
  mom: m,
});
