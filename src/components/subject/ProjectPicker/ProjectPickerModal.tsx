import { useState, useRef, useEffect, useCallback } from "react";
import { useSbjSyncCtx } from "@/store/SbjSyncContext";
import { ProjectCard } from "./ProjectCard";
import { PublicProjectCard } from "./PublicProjectCard";
import { Popup } from "@/components/Popup/Popup";

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
    <Popup className="proj-picker-overlay" onClose={closePicker}>
      <div className="proj-picker-modal">
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
          <Popup className="proj-dialog-overlay" onClose={handleNameCancel}>
            <div className="proj-name-dialog">
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
          </Popup>
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
    </Popup>
  );
};
