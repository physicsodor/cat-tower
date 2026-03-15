import { useCallback, useEffect, useRef, useState } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";
import { supabase } from "@/features/auth/supabase";
import { decodeList, decodeListCompact, encodeList, encodeListCompact } from "../types/Curriculum/curriculumCodec";
import type { Project } from "../types/Project";
import { LAST_PROJECT_KEY } from "@/features/subject/constants";

const PRE_LOGIN_KEY = "sbj_pre_login_state";
const DRAFT_KEY = "sbj_draft";
const SHARE_ID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function genShareId(): string {
  return Array.from({ length: 7 }, () => SHARE_ID_CHARS[Math.floor(Math.random() * SHARE_ID_CHARS.length)]).join("");
}

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
    `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`
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
  loadList: (v: ReadonlyArray<Curriculum>) => void
) => {
  const [loading, setLoading] = useState(true);
  const [savePending, setSavePending] = useState(false);
  const [dirty, _setDirty] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, _setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, _setCurrentProjectTitle] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  // Refs for use inside callbacks / event handlers
  const userIdRef = useRef<string | null>(null);
  const listRef = useRef(list);
  const lastSavedRef = useRef<string>("[]");
  const dirtyRef = useRef(false);
  const currentProjectIdRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
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
    _setCurrentProjectTitle(title);
  }, []);

  // ─── Fetch projects & hydrate ─────────────────────────────────────────────

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    const uid = userIdRef.current;
    if (!uid) return [];
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    const list = (data ?? []) as Project[];
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

      setProjects(fetchedProjects);

      // If shared URL data was present, show it instead of last project
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
        // Restore state from before the login redirect
        preLoginUsedRef.current = true;
        const decoded = decodeList(preLogin);
        loadList(decoded);
        lastSavedRef.current = "[]";
        setDirty(true);
      } else if (!preLoginUsedRef.current) {
        // Auto-load last opened project (or most recent)
        const lastId = localStorage.getItem(LAST_PROJECT_KEY);
        const target =
          fetchedProjects.find((p) => p.id === lastId) ?? fetchedProjects[0] ?? null;

        if (target) {
          const decoded = decodeList(target.data);
          loadList(decoded);
          lastSavedRef.current = encodeList(decoded);
          setCurrentProjectId(target.id);
          setCurrentProjectTitle(target.title);
          localStorage.setItem(LAST_PROJECT_KEY, target.id);
          setDirty(false);
        }
      }

      setLoading(false);
      fetchingRef.current = false;
    },
    [loadList, setCurrentProjectId, setCurrentProjectTitle, setDirty]
  );

  // ─── Auth watcher ─────────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active) return;
      if (user) {
        userIdRef.current = user.id;
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
      sessionTokenRef.current = session?.access_token ?? null;
      if (uid) {
        if (event === "SIGNED_IN") {
          // 실제 로그인 시에만 hydration — 토큰 갱신(TOKEN_REFRESHED) 등은 건너뜀
          fetchingRef.current = false;
          void fetchAndHydrate(uid);
        }
      } else {
        // Logged out
        preLoginUsedRef.current = false;
        setProjects([]);
        setCurrentProjectId(null);
        setCurrentProjectTitle(null);
        lastSavedRef.current = "[]";
        setDirty(false);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndHydrate, setCurrentProjectId, setCurrentProjectTitle, setDirty]);

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
      if (currentProjectIdRef.current) {
        await supabase
          .from("projects")
          .update({ data: encoded, updated_at: new Date().toISOString() })
          .eq("id", currentProjectIdRef.current)
          .eq("user_id", uid);
        // Update local projects list
        setProjects((prev) =>
          prev.map((p) =>
            p.id === currentProjectIdRef.current
              ? { ...p, data: encoded, updated_at: new Date().toISOString() }
              : p
          )
        );
      } else {
        // No current project — create a new one
        const { data: created } = await supabase
          .from("projects")
          .insert({ user_id: uid, title: "새 프로젝트", data: encoded })
          .select()
          .single();
        if (created) {
          const proj = created as Project;
          setProjects((prev) => [proj, ...prev]);
          setCurrentProjectId(proj.id);
          setCurrentProjectTitle(proj.title);
          localStorage.setItem(LAST_PROJECT_KEY, proj.id);
        }
      }
      lastSavedRef.current = encoded;
      setDirty(false);
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setSavePending(false);
    }
  }, [setCurrentProjectId, setCurrentProjectTitle, setDirty]);

  // ─── Load a project ───────────────────────────────────────────────────────

  const loadProject = useCallback(
    (project: Project) => {
      if (dirtyRef.current) {
        const ok = window.confirm(
          "저장되지 않은 변경이 있습니다.\n다른 프로젝트를 열면 변경 내용이 사라집니다.\n계속하시겠습니까?"
        );
        if (!ok) return;
      }
      const decoded = decodeList(project.data);
      loadList(decoded);
      lastSavedRef.current = encodeList(decoded);
      setCurrentProjectId(project.id);
      setCurrentProjectTitle(project.title);
      localStorage.setItem(LAST_PROJECT_KEY, project.id);
      setDirty(false);
      setIsPickerOpen(false);
    },
    [loadList, setCurrentProjectId, setCurrentProjectTitle, setDirty]
  );

  // ─── New project ─────────────────────────────────────────────────────────

  const newProject = useCallback(() => {
    if (dirtyRef.current) {
      const ok = window.confirm(
        "저장되지 않은 변경이 있습니다.\n새 프로젝트를 시작하면 변경 내용이 사라집니다.\n계속하시겠습니까?"
      );
      if (!ok) return;
    }
    loadList([]);
    lastSavedRef.current = "[]";
    setCurrentProjectId(null);
    setCurrentProjectTitle("새 프로젝트");
    localStorage.removeItem(LAST_PROJECT_KEY);
    setDirty(false);
    setIsPickerOpen(false);
  }, [loadList, setCurrentProjectId, setCurrentProjectTitle, setDirty]);

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
        localStorage.removeItem(LAST_PROJECT_KEY);
      }
    },
    [setCurrentProjectId, setCurrentProjectTitle]
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
    [setCurrentProjectTitle]
  );

  // ─── Picker open/close ────────────────────────────────────────────────────

  const openPicker = useCallback(() => {
    void fetchProjects();
    setIsPickerOpen(true);
  }, [fetchProjects]);

  const closePicker = useCallback(() => setIsPickerOpen(false), []);

  // ─── Beforeunload / pagehide / visibilitychange ───────────────────────────

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
      const uid = userIdRef.current;
      const pid = currentProjectIdRef.current;
      const token = sessionTokenRef.current;
      if (!uid || !pid || !token) return;
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?id=eq.${pid}`;
        const body = JSON.stringify({
          data: encodeList(normalizeCenter(listRef.current)),
          updated_at: new Date().toISOString(),
        });
        const headers: Record<string, string> = {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        };
        fetch(url, { method: "PATCH", headers, body, keepalive: true }).catch(() => {});
      } catch { /* ignore */ }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") emergencySave();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", emergencySave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", emergencySave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // ─── Sign in (saves current state before redirect) ───────────────────────────

  const signIn = useCallback(() => {
    sessionStorage.setItem(PRE_LOGIN_KEY, encodeList(listRef.current));
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
  }, []);

  // ─── Share URL / modal ────────────────────────────────────────────────────────

  const openShare = useCallback(async () => {
    setShareLoading(true);
    try {
      const encoded = encodeListCompact(listRef.current);
      const id = genShareId();
      await supabase.from("share_links").insert({ id, data: encoded });
      const url = new URL(window.location.href);
      url.searchParams.set("s", id);
      setShareUrl(url.toString());
    } finally {
      setShareLoading(false);
    }
  }, []);

  const closeShare = useCallback(() => setShareUrl(null), []);

  return {
    loading,
    savePending,
    dirty,
    isLoggedIn: userIdRef.current !== null,
    signIn,
    saveNow,
    shareUrl,
    shareLoading,
    openShare,
    closeShare,
    projects,
    currentProjectId,
    currentProjectTitle,
    isPickerOpen,
    openPicker,
    closePicker,
    loadProject,
    newProject,
    deleteProject,
    renameProject,
    fetchProjects,
  } as const;
};
