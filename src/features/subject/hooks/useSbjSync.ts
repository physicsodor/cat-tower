import { useCallback, useEffect, useRef, useState } from "react";
import type { Curriculum } from "@/features/subject/types/Curriculum/Curriculum";
import { supabase } from "@/features/auth/supabase";
import { decodeList, encodeList } from "../types/Curriculum/curriculumCodec";

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

/*
  useSbjSync (한국어)
  - 목적: 과목 리스트(list)를 Supabase와 동기화하는 최소 로직을 분리합니다.
  - 정책: 자동 저장 없음. 사용자가 저장 버튼을 눌렀을 때만 저장합니다.
  - 이탈: 미저장 변경이 있으면 탭/창 종료 시 브라우저 기본 확인창을 띄웁니다.
          실제로 떠나는 순간(pagehide)에 한해서 keepalive fetch로 한 번 저장을 시도합니다.

  반환값
  - loading: 최초 하이드레이션(서버 → 클라이언트) 중인지 여부
  - savePending: 저장 요청 진행 중 여부
  - dirty: 마지막 저장 이후 변경 존재 여부(저장 버튼 활성화 판단에 사용)
  - save(): 현재 list를 즉시 저장하는 함수
*/
export const useSbjSync = (
  list: ReadonlyArray<Curriculum>,
  setList: (v: ReadonlyArray<Curriculum>) => void
) => {
  const [loading, setLoading] = useState(true);
  const [savePending, setSavePending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const listRef = useRef(list);
  const lastSavedRef = useRef<string>("[]");
  const hydratingRef = useRef(false);
  const lastUidRef = useRef<string | null>(null);

  // 최신 list를 ref에 유지
  useEffect(() => {
    listRef.current = list;
  }, [list]);

  // 로그인 후 1회 하이드레이션
  const fetchInitial = useCallback(
    async (uid: string) => {
      if (hydratingRef.current) return;
      if (hydratedRef.current && lastUidRef.current === uid) return;
      hydratingRef.current = true;
      lastUidRef.current = uid;
      setLoading(true);
      const { data, error } = await supabase
        .from("sbj_lists")
        .select("data")
        .eq("user_id", uid)
        .maybeSingle();

      if (!error && data && !hydratedRef.current) {
        const raw = typeof data.data === "string" ? data.data : "[]";
        console.log("A");
        if ((listRef.current?.length ?? 0) === 0) {
          console.log("B");
          const decoded = decodeList(raw);
          setList(decoded);
          lastSavedRef.current = encodeList(decoded);
          setDirty(false);
        }
        console.log("C");

        hydratedRef.current = true;
      }

      if (!data && !hydratedRef.current) {
        hydratedRef.current = true;
        lastSavedRef.current = encodeList(listRef.current);
        setDirty(false);
      }

      setLoading(false);
      hydratingRef.current = false;
    },
    [setList]
  );

  // 수동 저장 API
  const saveNow = useCallback(async () => {
    const payload = normalizeCenter(listRef.current);
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      setSavePending(true);
      await supabase.from("sbj_lists").upsert(
        {
          user_id: uid,
          data: encodeList(payload),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      lastSavedRef.current = encodeList(payload);
      setDirty(false);
    } finally {
      setSavePending(false);
    }
  }, []);

  // 세션 감시 + 하이드레이션 트리거
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) {
        userIdRef.current = user.id;
        if (!hydratedRef.current) void fetchInitial(user.id);
      } else {
        setLoading(false);
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        const uid = session?.user?.id ?? null;
        userIdRef.current = uid;
        if (uid) {
          if (!hydratedRef.current) void fetchInitial(uid);
        } else setLoading(false);
      }
    );
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchInitial]);

  // 하이드레이션 후 dirty 추적(현재 상태 스냅샷 vs 마지막 저장 스냅샷 비교)
  useEffect(() => {
    if (!hydratedRef.current) return;
    const cur = encodeList(list);
    setDirty(cur !== lastSavedRef.current);
  }, [list]);

  // 이탈 전 확인 + 실제 이탈 시 Best‑effort 저장
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onPageHide = () => {
      if (!dirty) return;
      const uid = userIdRef.current;
      if (!uid) return;
      try {
        const url = `${
          import.meta.env.VITE_SUPABASE_URL
        }/rest/v1/sbj_lists?on_conflict=user_id`;
        const body = JSON.stringify([
          {
            user_id: uid,
            data: encodeList(normalizeCenter(listRef.current)),
            updated_at: new Date().toISOString(),
          },
        ]);
        const headers: Record<string, string> = {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "content-type": "application/json",
          Prefer: "resolution=merge-duplicates",
        };
        // 떠나는 순간에만 best‑effort 저장(네트워크/브라우저 제약으로 실패할 수 있음)
        fetch(url, { method: "POST", headers, body, keepalive: true }).catch(
          () => {}
        );
      } catch {
        // 무시
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [dirty]);

  return {
    loading,
    savePending,
    dirty,
    saveNow,
  } as const;
};
