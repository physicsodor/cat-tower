import { useState } from "react";
import "./App.css";
import { DefSbj, type Subject } from "./types/Subject";
import { type SelectMode } from "./types/SelectMode";
import { setDif, setUni } from "./utils/setOp";
import { itmByIdx } from "./utils/getByIdx";
import { type Course, DefCrs } from "./types/Course";

function App() {
  const [crsList, setCrsList] = useState<Course[]>([]);
  const [sbjList, setSbjList] = useState<Subject[]>([]);
  const [slcSet, setSlcSet] = useState<Set<number>>(new Set());

  const addSbj = () => {
    const idxList = sbjList.map((sbj) => sbj.idx).sort((a, b) => a - b);
    let i = 0;
    for (; i < idxList.length; i++) {
      if (i !== idxList[i]) break;
    }
    setSbjList((pSbjList) => [...pSbjList, DefSbj(i)]);
    setSlcSet(new Set([i]));
  };

  const delSbj = () => {
    setSbjList((pSbjList) => pSbjList.filter((sbj) => !slcSet.has(sbj.idx)));
    setSlcSet(new Set());
  };

  const addCrs = () => {
    const idxList = crsList.map((crs) => crs.idx).sort((a, b) => a - b);
    let i = 0;
    for (; i < idxList.length; i++) {
      if (i !== idxList[i]) break;
    }
    setCrsList((pCrsList) => [...pCrsList, DefCrs(i)]);
    setSlcSet(new Set([]));
  };

  const delCrs = (i: number) => () => {
    const mom = itmByIdx(crsList, crsList[i].mom);
    if (mom) {
      const nMom = mom.mom;
      setCrsList((pCrsList) =>
        pCrsList
          .filter((crs) => crs.idx !== i)
          .map((crs) => (crs.mom === i ? { ...crs, mom: nMom } : crs))
      );
      setSbjList((pSbjList) =>
        pSbjList.map((sbj) => (sbj.mom === i ? { ...sbj, mom: nMom } : sbj))
      );
    }
  };

  const slcSbj = (idxSet: Set<number>, mode: SelectMode) => {
    if (mode === "ADD") {
      setSlcSet((pSlcSet) => setUni(pSlcSet, idxSet));
    } else if (mode === "REPLACE") {
      setSlcSet(idxSet);
    } else if (mode === "REMOVE") {
      setSlcSet((pSlcSet) => setDif(pSlcSet, idxSet));
    }
  };

  const handle_sbj_onClick =
    (idx: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      let mode: SelectMode = "REPLACE";
      if (e.ctrlKey) mode = "ADD";
      else if (e.shiftKey) mode = "REMOVE";
      else if (slcSet.has(idx)) mode = "NONE";
      slcSbj(new Set([idx]), mode);
    };

  const makeCourse = (i: number) => (
    <div>
      <div onClick={delCrs(i)}>Course {i}</div>
      {crsList.filter((crs) => crs.mom === i).map((crs) => makeCourse(crs.idx))}
      {sbjList
        .filter((sbj) => sbj.mom === i)
        .map((sbj) => (
          <div>Subject {sbj.idx}</div>
        ))}
    </div>
  );

  return (
    <div className="App">
      <button onClick={addSbj}>추가</button>
      <button onClick={delSbj}>제거</button>
      <button onClick={addCrs}>그룹 추가</button>
      <div>{makeCourse(-1)}</div>
    </div>
  );
}

export default App;
