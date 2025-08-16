import "./App.css";
import { type SelectMode } from "./types/SelectMode";
import { useSubject } from "./hooks/useSubject";

function App() {
  const { sbjList, addSbj, delSbj, crsList, addCrs, delCrs, slcSet, select } =
    useSubject();

  const handle_sbj_onClick =
    (idx: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      let mode: SelectMode = "REPLACE";
      if (e.ctrlKey) mode = "ADD";
      else if (e.shiftKey) mode = "REMOVE";
      else if (slcSet.has(idx)) mode = "NONE";
      select(mode, idx);
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
