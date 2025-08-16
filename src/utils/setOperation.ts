export const setAdd = <T>(A: Set<T>, B: Set<T>) => {
  for (const x of B) A.add(x);
};

export const setUni = <T>(A: Set<T>, B: Set<T>) => {
  const C: Set<T> = new Set(A);
  for (const x of B) C.add(x);
  return C;
};
export const setDif = <T>(A: Set<T>, B: Set<T>) => {
  const C: Set<T> = new Set();
  for (const x of A) if (!B.has(x)) C.add(x);
  return C;
};
