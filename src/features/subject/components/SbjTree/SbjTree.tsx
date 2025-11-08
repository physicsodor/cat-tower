import { SbjTreeProvider } from "../../context/SbjTreeProvider";
import SbjTreeBox from "./SbjTreeBox";

const SbjTree = () => {
  return (
    <SbjTreeProvider>
      <SbjTreeBox />
    </SbjTreeProvider>
  );
};

export default SbjTree;
