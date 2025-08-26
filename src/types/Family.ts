export interface Family {
  idx: number;
  mom: number;
  bro: number;
}

export const DefFam = (i = 0, b = -1): Family => ({
  idx: i,
  mom: -1,
  bro: b,
});
