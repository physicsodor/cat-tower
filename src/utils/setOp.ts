export const setAdd = <T>(A: Set<T>, B: ReadonlySet<T>) => {
  for (const x of B) A.add(x);
};

export const setDel = <T>(A: Set<T>, B: ReadonlySet<T>) => {
  for (const x of B) A.delete(x);
};

export const setUni = <T>(A: ReadonlySet<T>, B: ReadonlySet<T>) => {
  if (B.size === 0) return new Set(A);
  if (A.size === 0) return new Set(B);
  const [S, L] = A.size < B.size ? [A, B] : [B, A];
  const C = new Set(L);
  for (const x of S) C.add(x);
  return C;
};

export const setDif = <T>(A: ReadonlySet<T>, B: ReadonlySet<T>) => {
  if (B.size === 0) return new Set(A);
  if (A.size === 0) return new Set<T>();
  if (B.size <= A.size) {
    const C = new Set(A);
    for (const x of B) C.delete(x);
    return C;
  } else {
    const C = new Set<T>();
    for (const x of A) if (!B.has(x)) C.add(x);
    return C;
  }
};
