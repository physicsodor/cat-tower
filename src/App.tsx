import { type SelectMode } from "./types/SelectMode";
import SubjectItem from "./components/SubjectItem";
import { CourseProvider } from "./context/CourseProvider";
import SubjectContainer from "./components/SubjectContainer";

function App() {
  return (
    <CourseProvider>
      <SubjectContainer />
    </CourseProvider>
  );
}

export default App;
