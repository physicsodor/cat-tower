import { type SelectMode } from "./types/SelectMode";
import SbjTreeItem from "./components/SbjTreeItem";
import { SubjectProvider } from "./context/SubjectProvider";
import SubjectContainer from "./components/SubjectContainer";

function App() {
  return (
    <SubjectProvider>
      <SubjectContainer />
    </SubjectProvider>
  );
}

export default App;
