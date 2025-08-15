import { useState } from "react";
import "./App.css";
import { DefSbj, type Subject } from "./types/Subject";

function App() {
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

  return (
    <div className="App">
      <button onClick={addSbj}>추가</button>
      <button onClick={delSbj}>제거</button>
      <div>{JSON.stringify(sbjList)}</div>
    </div>
  );
}

export default App;
