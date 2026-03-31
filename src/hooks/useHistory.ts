import { useCallback, useEffect, useRef, useState } from "react";
import type { Curriculum } from "@/lib/Curriculum/curriculum";

const MAX_HISTORY = 50;

export const useHistory = () => {
  const [list, setListState] = useState<ReadonlyArray<Curriculum>>([]);
  const listRef = useRef<ReadonlyArray<Curriculum>>([]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const pastRef = useRef<ReadonlyArray<Curriculum>[]>([]);
  const futureRef = useRef<ReadonlyArray<Curriculum>[]>([]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const setList: React.Dispatch<React.SetStateAction<ReadonlyArray<Curriculum>>> =
    useCallback(
      (updater) => {
        pastRef.current = [
          ...pastRef.current.slice(-(MAX_HISTORY - 1)),
          listRef.current,
        ];
        futureRef.current = [];
        setListState(updater);
        updateFlags();
      },
      [updateFlags],
    );

  const loadList = useCallback(
    (newList: ReadonlyArray<Curriculum>) => {
      pastRef.current = [];
      futureRef.current = [];
      setListState(newList);
      updateFlags();
    },
    [updateFlags],
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current[pastRef.current.length - 1];
    futureRef.current = [listRef.current, ...futureRef.current.slice(0, MAX_HISTORY - 1)];
    pastRef.current = pastRef.current.slice(0, -1);
    setListState(prev);
    updateFlags();
  }, [updateFlags]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), listRef.current];
    futureRef.current = futureRef.current.slice(1);
    setListState(next);
    updateFlags();
  }, [updateFlags]);

  return { list, listRef, setList, loadList, undo, redo, canUndo, canRedo };
};
