import { useState } from "react";
import "./App.css";
import type { Subject } from "./types/Subject";

function App() {
  const [sbjList, setSbjList] = useState<Subject[]>([]);
  return <div className="App"></div>;
}

export default App;
