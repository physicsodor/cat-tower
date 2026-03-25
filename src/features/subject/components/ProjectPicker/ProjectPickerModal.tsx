import { useState, useRef, useEffect, useCallback } from "react";
import { useSbjSyncCtx } from "../../store/SbjSyncContext";
import { ProjectThumbnail } from "./ProjectThumbnail";
import type { Project } from "../../model/Project";
import type { PublicProject } from "../../model/publicProject";

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

// ─── PublishDialog ────────────────────────────────────────────────────────────

type PublishDialogProps = {
  defaultSlug?: string;
  defaultTitle: string;
  onConfirm: (slug: string, title: string) => void;
  onCancel: () => void;
};

const PublishDialog = ({ defaultSlug = "", defaultTitle, onConfirm, onCancel }: PublishDialogProps) => {
  const [slug, setSlug] = useState(defaultSlug);
  const [title, setTitle] = useState(defaultTitle);
  const slugRef = useRef<HTMLInputElement>(null);

  useEffect(() => { slugRef.current?.focus(); }, []);

  const confirm = () => { if (slug.trim()) onConfirm(slug.trim(), title.trim() || defaultTitle); };

  return (
    <div className="proj-name-dialog-overlay" onClick={onCancel}>
      <div className="proj-name-dialog" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
};

// ─── PublicProjectCard ────────────────────────────────────────────────────────

type PublicCardProps = {
  pub: PublicProject;
  isActive: boolean;
  onLoad: (pub: PublicProject) => void;
  onEdit: (id: string, slug: string, title: string) => void;
  onDelete: (id: string) => void;
};

const PublicProjectCard = ({ pub, isActive, onLoad, onEdit, onDelete }: PublicCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [menuOpen]);

  return (
    <>
      <div className={`proj-card${isActive ? " -active" : ""}`} onClick={() => onLoad(pub)}>
        <div className="proj-card-thumb">
          <ProjectThumbnail data={pub.data} />
        </div>
        <div className="proj-card-footer" onClick={(e) => e.stopPropagation()}>
          <span className="proj-card-title">{pub.title}</span>
          <div className="proj-card-meta">
            <span className="proj-card-slug">/{pub.slug}</span>
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
                  <button onClick={() => { setMenuOpen(false); setEditing(true); }}>
                    URL · 제목 변경
                  </button>
                  <button
                    className="-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      if (window.confirm(`"/${pub.slug}" 공개 페이지를 삭제하시겠습니까?`))
                        onDelete(pub.id);
                    }}
                  >
                    공개 해제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {editing && (
        <PublishDialog
          defaultSlug={pub.slug}
          defaultTitle={pub.title}
          onConfirm={(slug, title) => { onEdit(pub.id, slug, title); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </>
  );
};

// ─── ProjectCard ─────────────────────────────────────────────────────────────

type CardProps = {
  project: Project;
  isActive: boolean;
  isAdmin: boolean;
  onLoad: (p: Project) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string, slug: string, title: string) => void;
};

const ProjectCard = ({ project, isActive, isAdmin, onLoad, onRename, onDelete, onPublish }: CardProps) => {
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

// ─── ProjectPickerModal ───────────────────────────────────────────────────────

export const ProjectPickerModal = () => {
  const {
    isPickerOpen,
    closePicker,
    projects,
    publicProjects,
    currentProjectId,
    currentPublicProject,
    isAdmin,
    loadProject,
    loadPublicProject,
    newProject,
    deleteProject,
    renameProject,
    publishProject,
    unpublishPublicProject,
    editPublicProject,
  } = useSbjSyncCtx();

  const [search, setSearch] = useState("");
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState("새 프로젝트");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameDialogOpen) nameInputRef.current?.select();
  }, [nameDialogOpen]);

  const handleNewProjectClick = useCallback(() => {
    setNameInput("새 프로젝트");
    setNameDialogOpen(true);
  }, []);

  const handleNameConfirm = useCallback(() => {
    newProject(nameInput.trim() || "새 프로젝트");
    setNameDialogOpen(false);
  }, [newProject, nameInput]);

  const handleNameCancel = useCallback(() => {
    setNameDialogOpen(false);
  }, []);

  const handlePublish = useCallback((projectId: string, slug: string, title: string) => {
    void publishProject(projectId, slug, title);
  }, [publishProject]);

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
          <button className="proj-picker-new-btn" onClick={handleNewProjectClick}>
            + 새 프로젝트
          </button>
        </div>

        {/* Name input dialog */}
        {nameDialogOpen && (
          <div className="proj-name-dialog-overlay" onClick={handleNameCancel}>
            <div className="proj-name-dialog" onClick={(e) => e.stopPropagation()}>
              <p className="proj-name-dialog-label">새 프로젝트 이름</p>
              <input
                ref={nameInputRef}
                className="proj-name-dialog-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameConfirm();
                  if (e.key === "Escape") handleNameCancel();
                }}
              />
              <div className="proj-name-dialog-actions">
                <button className="proj-name-dialog-cancel" onClick={handleNameCancel}>취소</button>
                <button className="proj-name-dialog-confirm" onClick={handleNameConfirm}>만들기</button>
              </div>
            </div>
          </div>
        )}

        {/* Admin: 공개 프로젝트 섹션 */}
        {isAdmin && (
          <div className="proj-picker-section">
            <h3 className="proj-picker-section-title">공개 프로젝트</h3>
            {publicProjects.length === 0 ? (
              <div className="proj-picker-empty">공개된 프로젝트가 없습니다.</div>
            ) : (
              <div className="proj-picker-grid">
                {publicProjects.map((pub) => (
                  <PublicProjectCard
                    key={pub.id}
                    pub={pub}
                    isActive={currentPublicProject?.id === pub.id}
                    onLoad={loadPublicProject}
                    onEdit={editPublicProject}
                    onDelete={unpublishPublicProject}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 개인 프로젝트 섹션 */}
        {isAdmin && <h3 className="proj-picker-section-title proj-picker-section-title--personal">내 프로젝트</h3>}
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
                isAdmin={isAdmin}
                onLoad={loadProject}
                onRename={renameProject}
                onDelete={deleteProject}
                onPublish={handlePublish}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
