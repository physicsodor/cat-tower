import { useSbjStore } from "../../context/SbjContext";
import SbjTree from "../SbjTree/SbjTree";

const SbjCtrl = () => {
  const { addCrs, addSbj, delSbj } = useSbjStore();
  return (
    <div className="sbj-ctrl">
      <div>
        <button onClick={addSbj}>추가</button>
        <button onClick={delSbj}>제거</button>
        <button onClick={addCrs}>그룹 만들기</button>
      </div>
      <SbjTree />
    </div>
  );
};

export default SbjCtrl;
