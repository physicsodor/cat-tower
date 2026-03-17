import { useSbjData } from "../store/SbjDataContext";
import { useSbjSelect } from "../store/SbjSelectContext";
import BttnPM from "@/components/Bttn/BttnPM";
import BttnDel from "@/components/Bttn/BttnDel";
import BttnGrp from "@/components/Bttn/BttnGrp";
import BttnCopy from "@/components/Bttn/BttnCopy";
import BttnCut from "@/components/Bttn/BttnCut";
import BttnPaste from "@/components/Bttn/BttnPaste";
const SbjCtrlBtns = () => {
  const { addSbj, delSbj, addCrs, copy, cut, paste, hasClip } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const hasSel = selectedSet.size > 0;

  return (
    <div className="sbj-ctrl-btns-panel">
      <BttnPM isPlus onDown={addSbj} className="-big" />
      {hasSel && <BttnDel onDown={delSbj} className="-big" />}
      {hasSel && <BttnGrp onDown={addCrs} className="-big" />}
      {hasSel && <BttnCopy onDown={copy} className="-big" />}
      {hasSel && <BttnCut onDown={cut} className="-big" />}
      {hasClip && <BttnPaste onDown={paste} className="-big" />}
    </div>
  );
};

export default SbjCtrlBtns;
