import { useState, useRef, useEffect } from "react";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { PublishDialog } from "./PublishDialog";
import type { Project } from "../../model/Project";

function formatDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diffMs / 86_400_000);
  if (d === 0) return "오늘";
  if (d === 1) return "어제";
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  if (d < 365) return `${Math.floor(d / 30)}개월 전`;
  return `${Math.floor(d / 365)}년 전`;
}

type CardProps = {
  project: Project;
  isActive: boolean;
  isAdmin: boolean;
  onLoad: (p: Project) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string, slug: string, title: string) => void;
};

export const ProjectCard = ({ project, isActive, isAdmin, onLoad, onRename, onDelete, onPublish }: CardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTitleInput(project.title); }, [project.title]);
  useEffect(() => { if (renaming) inputRef.current?.select(); }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [menuOpen]);

  const commitRename = () => {
    const t = titleInput.trim();
    if (t && t !== project.title) onRename(project.id, t);
    else setTitleInput(project.title);
    setRenaming(false);
  };

  return (
    <>
      <div
        className={`proj-card${isActive ? " -active" : ""}`}
        onClick={() => !renaming && onLoad(project)}
      >
        <div className="proj-card-thumb">
          <ProjectThumbnail data={project.data} />
        </div>
        <div className="proj-card-footer" onClick={(e) => e.stopPropagation()}>
          {renaming ? (
            <input
              ref={inputRef}
              className="proj-card-title-input"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setTitleInput(project.title); setRenaming(false); }
              }}
            />
          ) : (
            <span className="proj-card-title" onClick={() => onLoad(project)}>
              {project.title}
            </span>
          )}
          <div className="proj-card-meta">
            <span className="proj-card-date">{formatDate(project.updated_at)}</span>
            <div className="proj-card-menu-wrap" ref={menuRef}>
              <button
                className="proj-card-menu-btn"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                title="메뉴"
              >
                ⋮
              </button>
              {menuOpen && (
                <div className="proj-card-menu">
                  <button onClick={() => { setMenuOpen(false); setRenaming(true); }}>
                    이름 변경
                  </button>
                  {isAdmin && (
                    <button onClick={() => { setMenuOpen(false); setPublishing(true); }}>
                      공개 페이지로 만들기
                    </button>
                  )}
                  <button
                    className="-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      if (window.confirm(`"${project.title}"을(를) 삭제하시겠습니까?`))
                        onDelete(project.id);
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {publishing && (
        <PublishDialog
          defaultTitle={project.title}
          onConfirm={(slug, title) => { onPublish(project.id, slug, title); setPublishing(false); }}
          onCancel={() => setPublishing(false)}
        />
      )}
    </>
  );
};
