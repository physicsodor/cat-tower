import { useSbjData } from "../context/SbjDataContext";
import { useSbjSelect } from "../context/SbjSelectContext";

const SbjCtrlBtns = () => {
  const { addSbj, delSbj, addCrs, copy, cut, paste, hasClip } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const hasSel = selectedSet.size > 0;

  return (
    <div className="sbj-ctrl-btns-panel">
      <button className="sbj-ctrl-btn" onPointerDown={addSbj} title="추가하기">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 3v10M3 8h10"/>
        </svg>
      </button>
      <button className="sbj-ctrl-btn" onPointerDown={delSbj} title="제거하기">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8"/>
        </svg>
      </button>
      {hasSel && (
        <button className="sbj-ctrl-btn" onPointerDown={addCrs} title="그룹화하기">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="6" height="4" rx="1"/>
            <rect x="2" y="9" width="12" height="5" rx="1"/>
            <path d="M8 6v3"/>
          </svg>
        </button>
      )}
      {hasSel && (
        <button className="sbj-ctrl-btn" onPointerDown={copy} title="복사하기">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="9" height="9" rx="1"/>
            <path d="M5 5V3a1 1 0 011-1h7a1 1 0 011 1v9a1 1 0 01-1 1h-2"/>
          </svg>
        </button>
      )}
      {hasSel && (
        <button className="sbj-ctrl-btn" onPointerDown={cut} title="잘라내기">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="4.5" cy="12.5" r="1.8"/>
            <circle cx="11.5" cy="12.5" r="1.8"/>
            <path d="M4.5 10.7L8 5l3.5 5.7"/>
            <path d="M6.5 8h3"/>
          </svg>
        </button>
      )}
      {hasClip && (
        <button className="sbj-ctrl-btn" onPointerDown={paste} title="붙여넣기">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="10" height="9" rx="1"/>
            <path d="M6 5V3.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V5"/>
            <path d="M6 9h4M6 11.5h2.5"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default SbjCtrlBtns;
