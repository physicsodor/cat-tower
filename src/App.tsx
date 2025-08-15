import { useState } from "react";
import "./App.css";
import { DefSbj, type Subject } from "./types/Subject";
import { type SelectMode } from "./types/SelectMode";
import { setDif, setUni } from "./utils/setOp";

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

  return (
    <div className="App">
      <button onClick={addSbj}>추가</button>
      <button onClick={delSbj}>제거</button>
      <div>
        {sbjList.map((sbj) => (
          <div
            onClick={handle_sbj_onClick(sbj.idx)}
            style={{
              backgroundColor: slcSet.has(sbj.idx) ? "red" : "transparent",
            }}
          >
            <div>{sbj.idx}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
