import { use, useCallback, useMemo, useRef, useState } from "react";
import {
  type Course,
  type Curriculum,
  type Subject,
} from "../types/Curriculum";
import { buildFamilyMap, setBro, setMom, type BroDir } from "../utils/familyOp";
import {
  addCourse,
  addSubject,
  buildSbjMap,
  deleteCourse,
  deleteSubject,
} from "../utils/curriculumOp";
import { buildChainMap, setPre } from "../utils/chainOp";

export const useSubject = () => {
  const [list, setList] = useState<ReadonlyArray<Curriculum>>([]);
  const [slcSet, setSlcSet] = useState(new Set<number>());
  const [treeDrag, setTreeDrag] = useState(new Set<number>());
  const [cnvsDrag, setCnvsDrag] = useState(new Set<number>());
  const cnvsPxyRef = useRef({ px: 0, py: 0 });
  const preFromRef = useRef(-1);

  const idx2sbj = useMemo(() => buildSbjMap(list), [list]);
  const idx2family = useMemo(() => buildFamilyMap(list), [list]);
  const idx2chain = useMemo(() => buildChainMap(list), [list]);

  const addSbj = useCallback(() => {
    const { newIdx, updator } = addSubject(idx2family);
    setList(updator);
    setSlcSet(new Set([newIdx]));
  }, [idx2family]);

  const addCrs = useCallback(() => {
    const { updator } = addCourse(idx2family, slcSet);
    setList(updator);
  }, [idx2family, slcSet]);

  const delSbj = useCallback(() => {
    const { updator } = deleteSubject(slcSet);
    setList(updator);
    setSlcSet(new Set());
  }, [slcSet]);

  const delCrs = useCallback(
    (idx: number) => {
      const { updator } = deleteCourse(idx2family, idx);
      setList(updator);
      setSlcSet(new Set(idx2family.get(idx)?.kids ?? []));
    },
    [idx2family]
  );

  const slcSbj = useCallback(
    (e: PointerEvent | React.PointerEvent, idx: number) => {
      let s = new Set(slcSet);
      if (e.ctrlKey) s.add(idx);
      else if (e.shiftKey) s.delete(idx);
      else if (!slcSet.has(idx)) s = new Set([idx]);
      setSlcSet(s);
      return s;
    },
    [slcSet]
  );

  const setTreeMom = useCallback(
    (mom: number) => {
      const { updator } = setMom<Curriculum>(idx2family, treeDrag, mom);
      setList(updator);
      setTreeDrag(new Set());
    },
    [idx2family, treeDrag]
  );

  const setTreeBro = useCallback(
    (idx: number, dir: BroDir) => {
      const { updator } = setBro<Curriculum>(idx2family, treeDrag, idx, dir);
      setList(updator);
      setTreeDrag(new Set());
    },
    [idx2family, treeDrag]
  );

  const beginTreeDrag = useCallback((s: Set<number>) => setTreeDrag(s), []);
  const clearTreeDrag = useCallback(() => setTreeDrag(new Set()), []);
  const beginCnvsDrag = useCallback((s: Set<number>) => setCnvsDrag(s), []);
  const clearCnvsDrag = useCallback(() => setCnvsDrag(new Set()), []);

  const setCnvsPre = useCallback(
    (idx: number) => {
      const { newList } = setPre<Subject, Course>(
        list,
        preFromRef.current,
        idx
      );
      setList(newList);
      preFromRef.current = -1;
    },
    [list]
  );

  const setCnvsPos = ({ dx, dy }: { dx: number; dy: number }) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.sbjType === "COURSE" || !cnvsDrag.has(item.idx)) return item;
        return { ...item, x: item.x + dx, y: item.y + dy };
      })
    );
    setTreeDrag(new Set());
  };

  const setCnvsPxy = useCallback((pxy: { px: number; py: number }) => {
    cnvsPxyRef.current = pxy;
  }, []);
  const getCnvsPxy = useCallback(() => cnvsPxyRef.current, []);

  return {
    list,
    idx2sbj,
    idx2family,
    slcSet,
    addSbj,
    addCrs,
    delSbj,
    delCrs,
    slcSbj,
    setTreeMom,
    setTreeBro,
    treeDrag,
    beginTreeDrag,
    clearTreeDrag,
    cnvsDrag,
    beginCnvsDrag,
    clearCnvsDrag,
    setCnvsPre,
    setCnvsPos,
    setCnvsPxy,
    getCnvsPxy,
  };
};
