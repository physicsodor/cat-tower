import AuthDebug from "@/features/auth/AuthDebug";
import { useSbjData } from "../../context/SbjDataContext";
import { useSbjSyncStore } from "../../context/SbjSyncContext";
import SbjTreeBox from "./SbjTreeBox";

const SbjTree = () => {
  const { addCrs, addSbj, delSbj } = useSbjData();
  const { saveNow } = useSbjSyncStore();
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
