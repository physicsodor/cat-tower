export const setAdd = <T>(A: Set<T>, B: Set<T>) => {
  for (const x of B) A.add(x);
  return A;
};
export const setDel = <T>(A: Set<T>, B: Set<T>) => {
  for (const x of B) A.delete(x);
  return A;
};
