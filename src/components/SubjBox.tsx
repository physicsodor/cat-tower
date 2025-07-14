import { useState } from "react";

type Subject = {
  idx: number;
};

const subjDef = (i: number): Subject => ({
  idx: i,
});

const SubjBox = () => {
  const [infos, setInfos] = useState<Subject[]>([]);
  const [sels, setSels] = useState<Set<number>>(new Set());

  const addSubj = (): void => {
    const pIdxs = infos.map((info) => info.idx).sort((a, b) => a - b);
    let i = 0;
    while (pIdxs[i] === i) i++;
    setInfos((pInfos) => [...pInfos, subjDef(i)]);
  };

  const delSubj = (): void => {
    setInfos((pInfos) => pInfos.filter((info) => !sels.has(info.idx)));
    setSels(new Set());
  };

  const clrSel = (...idxs: number[]): void => setSels(new Set(idxs));

  return (
    <div className="SubjBox">
      <div>
        <button onClick={addSubj}>Add</button>
        <button onClick={delSubj}>Del</button>
      </div>
      <div>
        {infos.map((info) => (
          <div
            onClick={() => clrSel(info.idx)}
            style={{
              backgroundColor: sels.has(info.idx) ? "blue" : "transparent",
            }}
          >
            {info.idx}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjBox;
