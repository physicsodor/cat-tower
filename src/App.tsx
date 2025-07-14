import "./App.css";
import SubjBox from "./components/SubjBox";
import { SubjProvider } from "./context/SubjContext";

function App() {
  return (
    <div className="App">
      <SubjProvider>
        <SubjBox />
      </SubjProvider>
    </div>
  );
}

export default App;
