import { useState, useRef, useEffect } from "react";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { PublishDialog } from "./PublishDialog";
import type { PublicProject } from "@/lib/Project/publicProject";

type PublicCardProps = {
  pub: PublicProject;
  isActive: boolean;
  onLoad: (pub: PublicProject) => void;
  onEdit: (id: string, slug: string, title: string) => void;
  onDelete: (id: string) => void;
};

export const PublicProjectCard = ({ pub, isActive, onLoad, onEdit, onDelete }: PublicCardProps) => {
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
