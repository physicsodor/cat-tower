// ── Auto-layout ──────────────────────────────────────────────────────────────
export const LAYOUT_REM = 16;
export const LAYOUT_ROW_GAP = 2 * LAYOUT_REM;   // 인접 행 간 최소 간격 (edge-to-edge)
export const LAYOUT_COL_GAP = 1.5 * LAYOUT_REM; // 인접 열 간 최소 간격 (edge-to-edge)
export const LAYOUT_DEFAULT_W = 160;
export const LAYOUT_DEFAULT_H = 48;
export const LAYOUT_ITER = 10;

// ── Subject 수정 글자 수 제한 ──────────────────────────────────────────────
export const SHORT_MAX_BYTES = 10;
export const DESC_MAX_BYTES = 20;

// ── 캔버스 노드 내용 미리보기 ─────────────────────────────────────────────
export const CONTENT_PREVIEW_BYTES = 20;

// ── 붙여넣기 오프셋 ───────────────────────────────────────────────────────
export const PASTE_OFFSET = 40;

// ── 컨트롤 패널 ───────────────────────────────────────────────────────────
export const CTRL_MARGIN = 16;          // 1rem — 뷰포트 가장자리로부터의 여백
export const CTRL_HANDLE = 32;          // 핸들 크기
export const CTRL_DRAG_THRESHOLD = 4;   // 드래그 인식 최소 픽셀
export const CTRL_TRANSITION = "0.25s ease";

// ── 연결선 ────────────────────────────────────────────────────────────────
export const CURVE_BASE_STROKE = 4;

// ── 썸네일 ────────────────────────────────────────────────────────────────
export const THUMB_W = 200;
export const THUMB_H = 130;
export const THUMB_PAD = 14;

// ── 로컬 스토리지 ─────────────────────────────────────────────────────────
export const LAST_PROJECT_KEY = "lastProjectId";
