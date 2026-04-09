import { useAuth } from "@/hooks/useAuth";
import { useSbjSyncCtx } from "@/store/SbjSyncContext";
import SbjShareModal from "./SbjShareModal";

const SbjAuthPanel = () => {
  const { user, signOut } = useAuth();
  const { saveNow, dirty, savePending, currentProjectTitle, currentPublicProject, openPicker, openShare, closeShare, shareUrl, shareLoading, signIn } = useSbjSyncCtx();

  return (
    <div className="sbj-auth-panel">
      {user ? (
        <>
          {currentProjectTitle && (
            <button
              className="sbj-auth-proj-btn"
              onClick={openPicker}
              title="프로젝트 전환"
            >
              {currentPublicProject ? "🌐" : "📁"} {currentProjectTitle}
            </button>
          )}
          {!currentProjectTitle && (
            <button className="sbj-auth-proj-btn" onClick={openPicker}>
              내 프로젝트
            </button>
          )}
          <button
            className="sbj-auth-save-btn"
            onClick={saveNow}
            disabled={!dirty || savePending}
          >
            {savePending ? "저장 중..." : "저장"}
          </button>
          <button className="sbj-auth-btn" onClick={openShare} disabled={shareLoading}>
            {shareLoading ? "공유 중..." : "공유"}
          </button>
          <button className="sbj-auth-btn" onClick={signOut}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <button className="sbj-auth-btn" onClick={openShare} disabled={shareLoading}>
            {shareLoading ? "공유 중..." : "공유"}
          </button>
          <button className="sbj-auth-btn" onClick={() => signIn("google")}>
            Google 로그인
          </button>
          <button className="sbj-auth-btn" onClick={() => signIn("kakao")}>
            카카오 로그인
          </button>
        </>
      )}
      {shareUrl && (
        <SbjShareModal
          url={shareUrl}
          onClose={closeShare}
          onLogin={user ? undefined : (provider) => signIn(provider)}
        />
      )}
    </div>
  );
};

export default SbjAuthPanel;
