import { useSubjectStore } from "../../context/useSubjectStore";

const SbjCtrl = () => {
  const { addCrs, addSbj, delSbj } = useSubjectStore();
  return (
    <div className="sbj-ctrl">
      <button onClick={addSbj}>추가</button>
      <button onClick={delSbj}>제거</button>
      <button onClick={addCrs}>그룹 만들기</button>
    </div>
  );
};

export default SbjCtrl;
