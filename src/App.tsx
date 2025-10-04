// import { SubjectProvider } from "./context/SubjectProvider";
// import SubjectContainer from "./components/SubjectContainer";
import { getCommonMom } from "./utils/exCurriculumOp";

function App() {
  return (
    <div>
      {getCommonMom(
        new Map([
          [0, 1],
          // [1, 0],
          // [2, 1],
          // [3, 2],
          // [4, 3],
          // [5, 3],
          // [6, 5],
          // [7, 6],
          // [8, 6],
          // [9, 8],
        ]),
        new Set([0])
      )}
    </div>
    // <SubjectProvider>
    // <SubjectContainer />
    // </SubjectProvider>
  );
}

export default App;
