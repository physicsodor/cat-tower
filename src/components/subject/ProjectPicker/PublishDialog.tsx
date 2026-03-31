import { useState, useRef, useEffect } from "react";
import { Popup } from "@/components/Popup/Popup";

type PublishDialogProps = {
  defaultSlug?: string;
  defaultTitle: string;
  onConfirm: (slug: string, title: string) => void;
  onCancel: () => void;
};

export const PublishDialog = ({ defaultSlug = "", defaultTitle, onConfirm, onCancel }: PublishDialogProps) => {
  const [slug, setSlug] = useState(defaultSlug);
  const [title, setTitle] = useState(defaultTitle);
  const slugRef = useRef<HTMLInputElement>(null);

  useEffect(() => { slugRef.current?.focus(); }, []);

  const confirm = () => { if (slug.trim()) onConfirm(slug.trim(), title.trim() || defaultTitle); };

  return (
    <Popup className="proj-dialog-overlay" onClose={onCancel}>
      <div className="proj-name-dialog">
        <p className="proj-name-dialog-label">공개 페이지 설정</p>
        <label className="proj-publish-label">URL 경로</label>
        <input
          ref={slugRef}
          className="proj-name-dialog-input"
          value={slug}
          placeholder="예: example, math, physics-101"
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") onCancel(); }}
        />
        <label className="proj-publish-label">제목</label>
        <input
          className="proj-name-dialog-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") onCancel(); }}
        />
        <div className="proj-name-dialog-actions">
          <button className="proj-name-dialog-cancel" onClick={onCancel}>취소</button>
          <button className="proj-name-dialog-confirm" onClick={confirm} disabled={!slug.trim()}>
            공개
          </button>
        </div>
      </div>
    </Popup>
  );
};
