import { useCallback, useEffect, useRef, useState } from "react";
import type { Curriculum } from "@/lib/Curriculum/curriculum";
import { supabase } from "@/lib/supabase";
import { decodeList, decodeListCompact, encodeList } from "@/lib/Curriculum/curriculumCodec";
import type { Project } from "@/lib/Project";
import { LAST_PROJECT_KEY } from "@/lib/constants";
import { buildExampleCurriculum } from "@/lib/exampleProject";
import {
  type PublicProject,
  EXAMPLE_SLUG,
  extractUrlSlug,
  isAdminEmail,
  fetchPublicProjectBySlug,
  savePublicProject as savePublicProjectToDb,
  listPublicProjects,
} from "@/lib/publicProject";
import { useShareLink } from "./useShareLink";
import { usePublicProjectAdmin } from "./usePublicProjectAdmin";

const PRE_LOGIN_KEY = "sbj_pre_login_state";
const DRAFT_KEY = "sbj_draft";

function consumeShareParam(): Curriculum[] | null {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get("share");
  if (!shared) return null;
  const decoded = decodeListCompact(shared);
  params.delete("share");
  const newSearch = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`,
  );
  return decoded;
}

function consumeShareId(): string | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("s");
  if (!id) return null;
  params.delete("s");
  const newSearch = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`);
  return id;
}

/** Subject들의 bounding box 중심이 (0,0)이 되도록 x,y를 평행이동 */
function normalizeCenter(list: ReadonlyArray<Curriculum>): ReadonlyArray<Curriculum> {
  const subjects = list.filter((c): c is Extract<Curriculum, { sbjType: "SUBJECT" }> => c.sbjType === "SUBJECT");
  if (subjects.length === 0) return list;
  const xs = subjects.map((s) => s.x);
  const ys = subjects.map((s) => s.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  if (cx === 0 && cy === 0) return list;
  return list.map((c) => c.sbjType === "SUBJECT" ? { ...c, x: c.x - cx, y: c.y - cy } : c);
}

export const useSbjSync = (
  list: ReadonlyArray<Curriculum>,
  loadList: (v: ReadonlyArray<Curriculum>) => void,
) => {
  const [loading, setLoading] = useState(true);
  const [savePending, setSavePending] = useState(false);
  const [dirty, _setDirty] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, _setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, _setCurrentProjectTitle] = useState<string | null>(null);
  const currentProjectTitleRef = useRef<string | null>(null);
  const [currentPublicProject, _setCurrentPublicProject] = useState<PublicProject | null>(null);
  const currentPublicProjectRef = useRef<PublicProject | null>(null);
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Refs for use inside callbacks / event handlers
  const userIdRef = useRef<string | null>(null);
  const userEmailRef = useRef<string | null>(null);
  const listRef = useRef(list);
  const lastSavedRef = useRef<string>("[]");
  const dirtyRef = useRef(false);
  const currentProjectIdRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
  const hydratedRef = useRef(false);
  const sessionTokenRef = useRef<string | null>(null);

  // Shared data from URL ?share= param — consumed once on first render
  const sharedDataRef = useRef<Curriculum[] | null | undefined>(undefined);
  if (sharedDataRef.current === undefined) {
    sharedDataRef.current = consumeShareParam();
  }

  // Short share link ID from URL ?s= param — consumed once on first render
  const shareLinkIdRef = useRef<string | null | undefined>(undefined);
  if (shareLinkIdRef.current === undefined) {
    shareLinkIdRef.current = consumeShareId();
  }

  // URL slug for public project routes — consumed once on first render
  const urlSlugRef = useRef<string | null | undefined>(undefined);
  if (urlSlugRef.current === undefined) {
    urlSlugRef.current = extractUrlSlug(window.location.pathname);
  }

  // Pre-login state — consumed once on first render (before any async ops)
  const preLoginRef = useRef<string | null | undefined>(undefined);
  if (preLoginRef.current === undefined) {
    const stored = sessionStorage.getItem(PRE_LOGIN_KEY);
    if (stored) sessionStorage.removeItem(PRE_LOGIN_KEY);
    preLoginRef.current = stored ?? null;
  }
  const preLoginUsedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { listRef.current = list; }, [list]);

  const setDirty = useCallback((v: boolean) => {
    dirtyRef.current = v;
    _setDirty(v);
  }, []);

  const setCurrentProjectId = useCallback((id: string | null) => {
    currentProjectIdRef.current = id;
    _setCurrentProjectId(id);
  }, []);

  const setCurrentProjectTitle = useCallback((title: string | null) => {
    currentProjectTitleRef.current = title;
    _setCurrentProjectTitle(title);
  }, []);

  const setCurrentPublicProject = useCallback((pub: PublicProject | null) => {
    currentPublicProjectRef.current = pub;
    _setCurrentPublicProject(pub);
  }, []);

  // ─── Share link ───────────────────────────────────────────────────────────

  const { shareUrl, shareLoading, openShare, closeShare } = useShareLink(listRef);

  // ─── Public project admin ─────────────────────────────────────────────────

  const onCurrentUnpublished = useCallback(() => {
    lastSavedRef.current = "[]";
  }, []);

  const { publishProject, unpublishPublicProject, editPublicProject } = usePublicProjectAdmin(
    projects,
    setPublicProjects,
    currentPublicProjectRef,
    setCurrentPublicProject,
    setCurrentProjectTitle,
    onCurrentUnpublished,
  );

  // ─── Fetch projects & hydrate ─────────────────────────────────────────────

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    const uid = userIdRef.current;
    if (!uid) return [];
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    let list = (data ?? []) as Project[];
    if (list.length === 0) {
      const pubExample = await fetchPublicProjectBySlug(EXAMPLE_SLUG);
      const exampleTitle = pubExample?.title ?? "예시 프로젝트";
      const exampleData = pubExample ? pubExample.data : encodeList(buildExampleCurriculum());
      const { data: created } = await supabase
        .from("projects")
        .insert({ user_id: uid, title: exampleTitle, data: exampleData })
        .select()
        .single();
      if (created) list = [created as Project];
    }
    setProjects(list);
    return list;
  }, []);

  const fetchAndHydrate = useCallback(
    async (uid: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);

      let fetchedProjects = await (async () => {
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", uid)
          .order("updated_at", { ascending: false });
        return (data ?? []) as Project[];
      })();

      // Migration: if no projects yet, auto-import from legacy sbj_lists
      if (fetchedProjects.length === 0) {
        const { data: legacy } = await supabase
          .from("sbj_lists")
          .select("data")
          .eq("user_id", uid)
          .maybeSingle();
        if (legacy?.data) {
          const { data: created } = await supabase
            .from("projects")
            .insert({ user_id: uid, title: "내 커리큘럼", data: legacy.data })
            .select()
            .single();
          if (created) fetchedProjects = [created as Project];
        }
      }

      // No projects at all — create a default project seeded from public "example" or hardcoded fallback
      if (fetchedProjects.length === 0) {
        const pubExample = await fetchPublicProjectBySlug(EXAMPLE_SLUG);
        const exampleTitle = pubExample?.title ?? "예시 프로젝트";
        const exampleData = pubExample ? pubExample.data : encodeList(buildExampleCurriculum());
        const { data: created } = await supabase
          .from("projects")
          .insert({ user_id: uid, title: exampleTitle, data: exampleData })
          .select()
          .single();
        if (created) fetchedProjects = [created as Project];
      }

      setProjects(fetchedProjects);

      // If already hydrated and user has unsaved changes or is viewing a public project, don't overwrite
      if (hydratedRef.current && (dirtyRef.current || currentPublicProjectRef.current !== null)) {
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const shareId = shareLinkIdRef.current;
      shareLinkIdRef.current = null;
      const preLogin = preLoginRef.current;
      preLoginRef.current = null;

      if (shareId) {
        const { data: linkRow } = await supabase.from("share_links").select("data").eq("id", shareId).single();
        if (linkRow?.data) {
          const decoded = decodeListCompact(linkRow.data as string);
          loadList(decoded);
          lastSavedRef.current = encodeList(decoded);
          setDirty(false);
        }
      } else if (sharedDataRef.current) {
        loadList(sharedDataRef.current);
        lastSavedRef.current = encodeList(sharedDataRef.current);
        sharedDataRef.current = null;
        setDirty(false);
      } else if (preLogin) {
        preLoginUsedRef.current = true;
        const decoded = decodeList(preLogin);
        loadList(decoded);
        lastSavedRef.current = "[]";
        setDirty(true);
      } else if (urlSlugRef.current) {
        const pub = await fetchPublicProjectBySlug(urlSlugRef.current);
        if (pub) {
          const decoded = decodeList(pub.data);
          loadList(decoded);
          lastSavedRef.current = encodeList(decoded);
          setCurrentPublicProject(pub);
          setCurrentProjectId(null);
          setCurrentProjectTitle(pub.title);
          setDirty(false);
        } else if (!preLoginUsedRef.current) {
          const lastId = sessionStorage.getItem(LAST_PROJECT_KEY) ?? localStorage.getItem(LAST_PROJECT_KEY);
          const target = fetchedProjects.find((p) => p.id === lastId) ?? fetchedProjects[0] ?? null;
          if (target) {
            const decoded = decodeList(target.data);
            loadList(decoded);
            lastSavedRef.current = encodeList(decoded);
            setCurrentProjectId(target.id);
            setCurrentProjectTitle(target.title);
            sessionStorage.setItem(LAST_PROJECT_KEY, target.id);
            localStorage.setItem(LAST_PROJECT_KEY, target.id);
            setDirty(false);
          }
        }
      } else if (!preLoginUsedRef.current) {
        const lastId = sessionStorage.getItem(LAST_PROJECT_KEY) ?? localStorage.getItem(LAST_PROJECT_KEY);
        const target = fetchedProjects.find((p) => p.id === lastId) ?? fetchedProjects[0] ?? null;
        if (target) {
          const decoded = decodeList(target.data);
          loadList(decoded);
          lastSavedRef.current = encodeList(decoded);
          setCurrentProjectId(target.id);
          setCurrentProjectTitle(target.title);
          sessionStorage.setItem(LAST_PROJECT_KEY, target.id);
          localStorage.setItem(LAST_PROJECT_KEY, target.id);
          setDirty(false);
        }
      }

      hydratedRef.current = true;
      setLoading(false);
      fetchingRef.current = false;
    },
    [loadList, setCurrentProjectId, setCurrentProjectTitle, setCurrentPublicProject, setDirty],
  );

  // ─── Auth watcher ─────────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active) return;
      if (user) {
        userIdRef.current = user.id;
        userEmailRef.current = user.email ?? null;
        supabase.auth.getSession().then(({ data: { session } }) => {
          sessionTokenRef.current = session?.access_token ?? null;
        });
        void fetchAndHydrate(user.id);
      } else {
        const shareId = shareLinkIdRef.current;
        shareLinkIdRef.current = null;
        const preLogin = preLoginRef.current;
        preLoginRef.current = null;
        if (shareId) {
          const { data: linkRow } = await supabase.from("share_links").select("data").eq("id", shareId).single();
          if (!active) return;
          if (linkRow?.data) {
            const decoded = decodeListCompact(linkRow.data as string);
            loadList(decoded);
            lastSavedRef.current = encodeList(decoded);
          }
        } else if (sharedDataRef.current) {
          loadList(sharedDataRef.current);
          lastSavedRef.current = encodeList(sharedDataRef.current);
          sharedDataRef.current = null;
        } else if (preLogin) {
          loadList(decodeList(preLogin));
          lastSavedRef.current = preLogin;
        } else if (urlSlugRef.current) {
          const pub = await fetchPublicProjectBySlug(urlSlugRef.current);
          if (!active) return;
          if (pub) {
            const decoded = decodeList(pub.data);
            loadList(decoded);
            lastSavedRef.current = encodeList(decoded);
            setCurrentPublicProject(pub);
            setCurrentProjectId(null);
            setCurrentProjectTitle(pub.title);
          }
        } else {
          const draft = localStorage.getItem(DRAFT_KEY);
          if (draft) {
            loadList(decodeList(draft));
            lastSavedRef.current = draft;
          }
        }
        setDirty(false);
        setLoading(false);
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      userIdRef.current = uid;
      userEmailRef.current = session?.user?.email ?? null;
      sessionTokenRef.current = session?.access_token ?? null;
      if (uid) {
        if (event === "SIGNED_IN") {
          fetchingRef.current = false;
          void fetchAndHydrate(uid);
        }
      } else {
        preLoginUsedRef.current = false;
        userEmailRef.current = null;
        setProjects([]);
        setCurrentProjectId(null);
        setCurrentProjectTitle(null);
        setCurrentPublicProject(null);
        lastSavedRef.current = "[]";
        setDirty(false);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndHydrate, loadList, setCurrentProjectId, setCurrentProjectTitle, setCurrentPublicProject, setDirty]);

  // ─── Dirty tracking ───────────────────────────────────────────────────────

  useEffect(() => {
    if (loading) return;
    const cur = encodeList(list);
    setDirty(cur !== lastSavedRef.current);
  }, [list, loading, setDirty]);

  // ─── Save ─────────────────────────────────────────────────────────────────

  const saveNow = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    const payload = normalizeCenter(listRef.current);
    const encoded = encodeList(payload);
    setSavePending(true);
    try {
      // 관리자가 공개 프로젝트를 저장 → public_projects 테이블 업데이트
      if (currentPublicProjectRef.current && isAdminEmail(userEmailRef.current)) {
        await savePublicProjectToDb(currentPublicProjectRef.current.id, encoded);
        const updated = { ...currentPublicProjectRef.current, data: encoded, updated_at: new Date().toISOString() };
        setCurrentPublicProject(updated);
        setPublicProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        lastSavedRef.current = encoded;
        setDirty(false);
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      if (currentProjectIdRef.current) {
        await supabase
          .from("projects")
          .update({ data: encoded, updated_at: new Date().toISOString() })
          .eq("id", currentProjectIdRef.current)
          .eq("user_id", uid);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === currentProjectIdRef.current
              ? { ...p, data: encoded, updated_at: new Date().toISOString() }
              : p,
          ),
        );
      } else {
        // 현재 프로젝트 없음 — 새 개인 프로젝트로 저장 (공개 프로젝트 보던 일반 유저도 여기로)
        const { data: created } = await supabase
          .from("projects")
          .insert({ user_id: uid, title: currentProjectTitleRef.current ?? "새 프로젝트", data: encoded })
          .select()
          .single();
        if (created) {
          const proj = created as Project;
          setProjects((prev) => [proj, ...prev]);
          setCurrentProjectId(proj.id);
          setCurrentProjectTitle(proj.title);
          setCurrentPublicProject(null);
          sessionStorage.setItem(LAST_PROJECT_KEY, proj.id);
          localStorage.setItem(LAST_PROJECT_KEY, proj.id);
        }
      }
      lastSavedRef.current = encoded;
      setDirty(false);
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setSavePending(false);
    }
  }, [setCurrentProjectId, setCurrentProjectTitle, setCurrentPublicProject, setDirty]);

  // ─── Load a project ───────────────────────────────────────────────────────

  const loadProject = useCallback(
    (project: Project) => {
      if (dirtyRef.current) {
        const ok = window.confirm(
          "저장되지 않은 변경이 있습니다.\n다른 프로젝트를 열면 변경 내용이 사라집니다.\n계속하시겠습니까?",
        );
        if (!ok) return;
      }
      const decoded = decodeList(project.data);
      loadList(decoded);
      lastSavedRef.current = encodeList(decoded);
      setCurrentProjectId(project.id);
      setCurrentProjectTitle(project.title);
      setCurrentPublicProject(null);
      sessionStorage.setItem(LAST_PROJECT_KEY, project.id);
      localStorage.setItem(LAST_PROJECT_KEY, project.id);
      setDirty(false);
      setIsPickerOpen(false);
    },
    [loadList, setCurrentProjectId, setCurrentProjectTitle, setCurrentPublicProject, setDirty],
  );

  // ─── Load a public project ────────────────────────────────────────────────

  const loadPublicProject = useCallback(
    (pub: PublicProject) => {
      if (dirtyRef.current) {
        const ok = window.confirm(
          "저장되지 않은 변경이 있습니다.\n다른 프로젝트를 열면 변경 내용이 사라집니다.\n계속하시겠습니까?",
        );
        if (!ok) return;
      }
      const decoded = decodeList(pub.data);
      loadList(decoded);
      lastSavedRef.current = encodeList(decoded);
      setCurrentProjectId(null);
      setCurrentProjectTitle(pub.title);
      setCurrentPublicProject(pub);
      setDirty(false);
      setIsPickerOpen(false);
    },
    [loadList, setCurrentProjectId, setCurrentProjectTitle, setCurrentPublicProject, setDirty],
  );

  // ─── New project ─────────────────────────────────────────────────────────

  const newProject = useCallback(async (title: string) => {
    if (dirtyRef.current) {
      const ok = window.confirm(
        "저장되지 않은 변경이 있습니다.\n새 프로젝트를 시작하면 변경 내용이 사라집니다.\n계속하시겠습니까?",
      );
      if (!ok) return;
    }
    const uid = userIdRef.current;
    loadList([]);
    lastSavedRef.current = "[]";
    setCurrentPublicProject(null);
    setDirty(false);
    setIsPickerOpen(false);
    if (uid) {
      const { data: created } = await supabase
        .from("projects")
        .insert({ user_id: uid, title, data: "[]" })
        .select()
        .single();
      if (created) {
        const proj = created as Project;
        setProjects((prev) => [proj, ...prev]);
        setCurrentProjectId(proj.id);
        setCurrentProjectTitle(proj.title);
        sessionStorage.setItem(LAST_PROJECT_KEY, proj.id);
        localStorage.setItem(LAST_PROJECT_KEY, proj.id);
        return;
      }
    }
    setCurrentProjectId(null);
    setCurrentProjectTitle(title);
    sessionStorage.removeItem(LAST_PROJECT_KEY);
    localStorage.removeItem(LAST_PROJECT_KEY);
  }, [loadList, setCurrentProjectId, setCurrentProjectTitle, setCurrentPublicProject, setDirty]);

  // ─── Delete project ───────────────────────────────────────────────────────

  const deleteProject = useCallback(
    async (id: string) => {
      const uid = userIdRef.current;
      if (!uid) return;
      await supabase.from("projects").delete().eq("id", id).eq("user_id", uid);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (currentProjectIdRef.current === id) {
        setCurrentProjectId(null);
        setCurrentProjectTitle(null);
        sessionStorage.removeItem(LAST_PROJECT_KEY);
        localStorage.removeItem(LAST_PROJECT_KEY);
      }
    },
    [setCurrentProjectId, setCurrentProjectTitle],
  );

  // ─── Rename project ───────────────────────────────────────────────────────

  const renameProject = useCallback(
    async (id: string, title: string) => {
      const uid = userIdRef.current;
      if (!uid) return;
      await supabase.from("projects").update({ title }).eq("id", id).eq("user_id", uid);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
      if (currentProjectIdRef.current === id) setCurrentProjectTitle(title);
    },
    [setCurrentProjectTitle],
  );

  // ─── Picker open/close ────────────────────────────────────────────────────

  const openPicker = useCallback(() => {
    void fetchProjects();
    if (isAdminEmail(userEmailRef.current)) {
      void listPublicProjects().then(setPublicProjects);
    }
    setIsPickerOpen(true);
  }, [fetchProjects]);

  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  // ─── Beforeunload / pagehide ─────────────────────────────────────────────

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
    };
    const emergencySave = () => {
      if (!dirtyRef.current) return;
      try {
        localStorage.setItem(DRAFT_KEY, encodeList(listRef.current));
      } catch { /* ignore */ }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", emergencySave);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", emergencySave);
    };
  }, []);

  // ─── Sign in ─────────────────────────────────────────────────────────────

  const signIn = useCallback(() => {
    sessionStorage.setItem(PRE_LOGIN_KEY, encodeList(listRef.current));
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
  }, []);

  return {
    loading,
    savePending,
    dirty,
    isLoggedIn: userIdRef.current !== null,
    isAdmin: isAdminEmail(userEmailRef.current),
    signIn,
    saveNow,
    shareUrl,
    shareLoading,
    openShare,
    closeShare,
    projects,
    currentProjectId,
    currentProjectTitle,
    currentPublicProject,
    publicProjects,
    isPickerOpen,
    openPicker,
    closePicker,
    loadProject,
    loadPublicProject,
    newProject,
    deleteProject,
    renameProject,
    fetchProjects,
    publishProject,
    unpublishPublicProject,
    editPublicProject,
  } as const;
};
