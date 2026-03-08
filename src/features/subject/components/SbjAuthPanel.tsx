import { useAuth } from "@/features/auth/useAuth";
import { useSbjSyncStore } from "../context/SbjSyncContext";

const SbjAuthPanel = () => {
  const { user, signIn, signOut } = useAuth();
  const { saveNow, dirty, savePending } = useSbjSyncStore();

  return (
    <div className="sbj-auth-panel">
      {user ? (
        <>
          <button
            className="sbj-auth-save-btn"
            onClick={saveNow}
            disabled={!dirty || savePending}
          >
            {savePending ? "저장 중..." : "저장"}
          </button>
          <button className="sbj-auth-btn" onClick={signOut}>
            로그아웃
          </button>
        </>
      ) : (
        <button className="sbj-auth-btn" onClick={signIn}>
          Google 로그인
        </button>
      )}
    </div>
  );
};

export default SbjAuthPanel;
