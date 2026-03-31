import { useCallback } from "react";
import type { RefObject } from "react";
import type { Project } from "@/lib/Project";
import type { PublicProject } from "@/lib/publicProject";
import {
  createPublicProject,
  deletePublicProject,
  updatePublicProject,
} from "@/lib/publicProject";

export const usePublicProjectAdmin = (
  projects: Project[],
  setPublicProjects: React.Dispatch<React.SetStateAction<PublicProject[]>>,
  currentPublicProjectRef: RefObject<PublicProject | null>,
  setCurrentPublicProject: (pub: PublicProject | null) => void,
  setCurrentProjectTitle: (title: string | null) => void,
  onCurrentUnpublished: () => void,
) => {
  const publishProject = useCallback(
    async (projectId: string, slug: string, title?: string): Promise<PublicProject | null> => {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) return null;
      const pub = await createPublicProject(slug, title ?? proj.title, proj.data);
      if (pub) setPublicProjects((prev) => [...prev, pub].sort((a, b) => a.slug.localeCompare(b.slug)));
      return pub;
    },
    [projects, setPublicProjects],
  );

  const unpublishPublicProject = useCallback(
    async (publicId: string) => {
      await deletePublicProject(publicId);
      setPublicProjects((prev) => prev.filter((p) => p.id !== publicId));
      if (currentPublicProjectRef.current?.id === publicId) {
        setCurrentPublicProject(null);
        setCurrentProjectTitle(null);
        onCurrentUnpublished();
      }
    },
    [setPublicProjects, currentPublicProjectRef, setCurrentPublicProject, setCurrentProjectTitle, onCurrentUnpublished],
  );

  const editPublicProject = useCallback(
    async (publicId: string, slug: string, title: string) => {
      await updatePublicProject(publicId, slug, title);
      setPublicProjects((prev) => prev.map((p) => (p.id === publicId ? { ...p, slug, title } : p)));
      if (currentPublicProjectRef.current?.id === publicId) {
        setCurrentPublicProject({ ...currentPublicProjectRef.current, slug, title });
        setCurrentProjectTitle(title);
      }
    },
    [setPublicProjects, currentPublicProjectRef, setCurrentPublicProject, setCurrentProjectTitle],
  );

  return { publishProject, unpublishPublicProject, editPublicProject };
};
