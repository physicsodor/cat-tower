import { useState } from "react";

type Subject = {
  idx: number;
};

const subjDef = (i: number): Subject => ({
  idx: i,
});

const SubjBox = () => {
  const [infos, setInfos] = useState<Subject[]>([]);
  const addSubj = (): void => {
    const pInfos = infos;
    const pIdxs = pInfos.map((info) => info.idx).sort((a, b) => a - b);
    let i = 0;
    while (pIdxs[i] === i) i++;
    setInfos([...pInfos, subjDef(i)]);
  };
  return (
    <div className="SubjBox">
      <div>
        <button onClick={addSubj}>Add</button>
        <button>Del</button>
      </div>
      <div>
        {infos.map((info) => (
          <div>{info.idx}</div>
        ))}
      </div>
    </div>
  );
};

export default SubjBox;
