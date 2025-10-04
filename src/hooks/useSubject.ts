import { useCallback, useState } from "react";
import { type Curriculum } from "../types/Curriculum";
import { setDif } from "../utils/setOp";
import { buildFamilyMap, getFlatIdxs } from "../utils/familyOp";
import { addCourse, addSubject } from "../utils/curriculumOp";
import { generateNKeysBetween } from "fractional-indexing";

export const useSubject = () => {
  const [list, setList] = useState<ReadonlyArray<Curriculum>>([]);
  const [slcSet, setSlcSet] = useState(new Set<number>());
  const [treeDrag, setTreeDrag] = useState(new Set<number>());

  // const idx2family = useMemo(() => buildFamilyMap(list), [list]);

  const addSbj = useCallback(() => {
    const { newList, newIdx } = addSubject(list);
    setList(newList);
    setSlcSet(new Set([newIdx]));
  }, [list]);

  const addCrs = useCallback(() => {
    const { newList } = addCourse(list, slcSet);
    setList(newList);
  }, [list, slcSet]);

  const delSbj = useCallback(() => {
    const newList: Curriculum[] = [];
    for (const x of list) {
      if (slcSet.has(x.idx)) continue;
      if (x.sbjType === "COURSE") newList.push(x);
      else {
        const pre = setDif(x.pre, slcSet);
        newList.push({ ...x, pre });
      }
    }
    setList(newList);
    setSlcSet(new Set());
  }, [list, slcSet]);

  const delCrs = useCallback(
    (idx: number) => {
      const idx2family = buildFamilyMap(list);
      const mom = idx2family.get(idx)?.mom ?? -1;
      const newList: Curriculum[] = [];
      for (const x of list) {
        if (slcSet.has(x.idx)) continue;
        if (x.mom !== idx) newList.push(x);
        else newList.push({ ...x, mom });
      }
      setList(newList);
      setSlcSet(new Set());
    },
    [list, slcSet]
  );

  const setTreeMom = useCallback(
    (mom: number) => {
      const idx2family = buildFamilyMap(list);
      let testMom = mom;
      while (testMom >= 0) {
        if (treeDrag.has(testMom)) return;
        testMom = idx2family.get(testMom)?.mom ?? -1;
      }
      const { flatIdxs } = getFlatIdxs(idx2family, treeDrag);
      const lastBro = idx2family.get(mom)?.last ?? null;
      const bros = generateNKeysBetween(lastBro, null, flatIdxs.length);
      const idx2bro = new Map<number, string>();
      for (let i = 0; i < flatIdxs.length; i++)
        idx2bro.set(flatIdxs[i], bros[i]);
      const newList = list.map((x) =>
        treeDrag.has(x.idx) ? { ...x, mom, bro: idx2bro.get(x.idx) ?? "" } : x
      );
      setList(newList);
      setTreeDrag(new Set());
    },
    [list, treeDrag]
  );

  return { addSbj, addCrs, delSbj, delCrs, setTreeMom };
};
