import { CurriculumProvider } from "./context/CurriculumProvider";
import SubjectContainer from "./components/SubjectContainer";

function App() {
  return (
    <CurriculumProvider>
      <SubjectContainer />
    </CurriculumProvider>
  );
}

export default App;
