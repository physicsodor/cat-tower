import { useSubjContext } from "../context/SubjContext";

const SubjBox = () => {
  const { state, dispatch } = useSubjContext();

  return (
    <div className="SubjBox">
      <div>
        <button onClick={() => dispatch({ type: "ADD_SUBJ" })}>Add</button>
        <button onClick={() => dispatch({ type: "DEL_SUBJ" })}>Del</button>
        <div>{JSON.stringify(state.infos)}</div>
      </div>
      <div>
        {state.infos.map((info) => (
          <div
            key={`Subj-${info.idx}`}
            onClick={() => dispatch({ type: "CLR_SELS", idxs: [info.idx] })}
            style={{
              backgroundColor: state.sels.has(info.idx)
                ? "blue"
                : "transparent",
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
