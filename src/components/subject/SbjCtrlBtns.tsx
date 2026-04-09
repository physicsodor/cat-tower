import { useSbjData } from "@/store/SbjDataContext";
import { useSbjSelect } from "@/store/SbjSelectContext";
import { BttnPM, BttnDel, BttnGrp, BttnCopy, BttnCut, BttnPaste } from "button-bundle";
const LabeledBttn = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="bttn-labeled">
    <div className="bttn-label-clip">
      <span className="bttn-label">{label}</span>
    </div>
    {children}
  </div>
);

const SbjCtrlBtns = () => {
  const { addSbj, delSbj, addCrs, copy, cut, paste, hasClip } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const hasSel = selectedSet.size > 0;

  return (
    <div className="sbj-ctrl-btns-panel">
      <LabeledBttn label="Add">
        <BttnPM isPlus onDown={addSbj} className="-big" />
      </LabeledBttn>
      {hasSel && (
        <LabeledBttn label="Delete">
          <BttnDel onDown={delSbj} className="-big" />
        </LabeledBttn>
      )}
      {hasSel && (
        <LabeledBttn label="Group">
          <BttnGrp onDown={addCrs} className="-big" />
        </LabeledBttn>
      )}
      {hasSel && (
        <LabeledBttn label="Copy">
          <BttnCopy onDown={copy} className="-big" />
        </LabeledBttn>
      )}
      {hasSel && (
        <LabeledBttn label="Cut">
          <BttnCut onDown={cut} className="-big" />
        </LabeledBttn>
      )}
      {hasClip && (
        <LabeledBttn label="Paste">
          <BttnPaste onDown={paste} className="-big" />
        </LabeledBttn>
      )}
    </div>
  );
};

export default SbjCtrlBtns;
