import { useAuth } from "@/features/auth/useAuth";
import { useSbjSyncCtx } from "../store/SbjSyncContext";
import SbjShareModal from "./SbjShareModal";

const SbjAuthPanel = () => {
  const { user, signOut } = useAuth();
  const { saveNow, dirty, savePending, currentProjectTitle, openPicker, openShare, closeShare, shareUrl, shareLoading, signIn } = useSbjSyncCtx();

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
              📁 {currentProjectTitle}
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
          <button className="sbj-auth-btn" onClick={signIn}>
            Google 로그인
          </button>
        </>
      )}
      {shareUrl && (
        <SbjShareModal
          url={shareUrl}
          onClose={closeShare}
          onLogin={user ? undefined : signIn}
        />
      )}
    </div>
  );
};

export default SbjAuthPanel;
