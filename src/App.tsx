import { type SelectMode } from "./types/SelectMode";
import SbjItm from "./components/SbjItm";
import { CourseProvider } from "./context/CourseProvider";
import SbjContainer from "./components/SbjContainer";

function App() {
  return (
    <CourseProvider>
      <SbjContainer />
    </CourseProvider>
  );
}

export default App;
