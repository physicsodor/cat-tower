import { useState, useRef, useEffect } from "react";
import { useSbjSyncCtx } from "../../context/SbjSyncContext";
import { ProjectThumbnail } from "./ProjectThumbnail";
import type { Project } from "../../types/Project";

// ─── Utilities ──────────────────────────────────────────────────────────────

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

// ─── ProjectCard ─────────────────────────────────────────────────────────────

type CardProps = {
  project: Project;
  isActive: boolean;
  onLoad: (p: Project) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

const ProjectCard = ({ project, isActive, onLoad, onRename, onDelete }: CardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync title when project changes externally
  useEffect(() => {
    setTitleInput(project.title);
  }, [project.title]);

  // Focus input on rename
  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  // Close menu on outside click
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
              if (e.key === "Escape") {
                setTitleInput(project.title);
                setRenaming(false);
              }
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
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              title="메뉴"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="proj-card-menu">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                  }}
                >
                  이름 변경
                </button>
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
  );
};

// ─── ProjectPickerModal ───────────────────────────────────────────────────────

export const ProjectPickerModal = () => {
  const {
    isPickerOpen,
    closePicker,
    projects,
    currentProjectId,
    loadProject,
    newProject,
    deleteProject,
    renameProject,
  } = useSbjSyncCtx();

  const [search, setSearch] = useState("");

  if (!isPickerOpen) return null;

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="proj-picker-overlay" onClick={closePicker}>
      <div className="proj-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="proj-picker-header">
          <h2 className="proj-picker-heading">내 프로젝트</h2>
          <input
            className="proj-picker-search"
            placeholder="제목으로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="proj-picker-close" onClick={closePicker} title="닫기">
            ✕
          </button>
        </div>

        {/* New project button */}
        <div className="proj-picker-toolbar">
          <button className="proj-picker-new-btn" onClick={newProject}>
            + 새 프로젝트
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="proj-picker-empty">
            {search ? "검색 결과가 없습니다." : "저장된 프로젝트가 없습니다."}
          </div>
        ) : (
          <div className="proj-picker-grid">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                isActive={p.id === currentProjectId}
                onLoad={loadProject}
                onRename={renameProject}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
