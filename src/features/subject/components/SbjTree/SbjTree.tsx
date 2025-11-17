import AuthDebug from "@/AuthDebug";
import { useSbjStore } from "../../context/SbjContext";
import SbjTreeBox from "./SbjTreeBox";

const SbjTree = () => {
  const { addCrs, addSbj, delSbj, saveNow } = useSbjStore();
  return (
    <div className="sbj-ctrl">
      <AuthDebug />
      <div>
        <button onClick={saveNow}>저장</button>
        <button onClick={addSbj}>추가</button>
        <button onClick={delSbj}>제거</button>
        <button onClick={addCrs}>그룹 만들기</button>
      </div>
      <SbjTreeBox />
    </div>
  );
};

export default SbjTree;
