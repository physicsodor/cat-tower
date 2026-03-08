import { useEffect, useState } from "react";
import { useSbjData } from "../context/SbjDataContext";

const encoder = new TextEncoder();

const limitBytes = (v: string, max: number): string => {
  if (encoder.encode(v).length <= max) return v;
  let bytes = 0;
  let result = "";
  for (const char of v) {
    const b = encoder.encode(char).length;
    if (bytes + b > max) break;
    bytes += b;
    result += char;
  }
  return result;
};

type Fields = { title: string; short?: string; content: string; description: string };

type FormProps = {
  idx: number;
  info: Fields;
  closeEdit: () => void;
  updateSbj: (idx: number, fields: Fields) => void;
};

const SbjEditForm = ({ idx, info, closeEdit, updateSbj }: FormProps) => {
  const [title, setTitle] = useState(info.title);
  const [short, setShort] = useState(info.short ?? "");
  const [content, setContent] = useState(info.content);
  const [description, setDescription] = useState(info.description);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeEdit(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeEdit]);

  const onConfirm = () => {
    updateSbj(idx, { title, short: short || undefined, content, description });
    closeEdit();
  };

  const shortBytes = encoder.encode(short).length;
  const descBytes = encoder.encode(description).length;

  return (
    <div className="sbj-edit-overlay" onPointerDown={closeEdit}>
      <div className="sbj-edit-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="sbj-edit-row">
          <label>제목</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="sbj-edit-row">
          <label>약칭</label>
          <input
            value={short}
            onChange={(e) => setShort(limitBytes(e.target.value, 10))}
          />
          <span className="sbj-edit-bytes">{shortBytes}/10</span>
        </div>
        <div className="sbj-edit-row">
          <label>내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="sbj-edit-row">
          <label>요약</label>
          <input
            value={description}
            onChange={(e) => setDescription(limitBytes(e.target.value, 20))}
          />
          <span className="sbj-edit-bytes">{descBytes}/20</span>
        </div>
        <div className="sbj-edit-btns">
          <button className="sbj-edit-btn" onClick={closeEdit}>취소</button>
          <button className="sbj-edit-btn -confirm" onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
};

const SbjEditModal = () => {
  const { editingIdx, closeEdit, updateSbj, idx2sbj } = useSbjData();
  if (editingIdx === null) return null;
  const info = idx2sbj.get(editingIdx);
  if (!info || info.sbjType !== "SUBJECT") return null;
  return <SbjEditForm key={editingIdx} idx={editingIdx} info={info} closeEdit={closeEdit} updateSbj={updateSbj} />;
};

export default SbjEditModal;
