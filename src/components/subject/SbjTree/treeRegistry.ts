import type { BroDir } from "@/lib/Family/family";

export type TreeDropTarget = {
  el: HTMLElement;
  setDir: (d: BroDir | null) => void;
  onDrop: (dragged: ReadonlySet<number>, dir: BroDir) => void;
};

/** 모든 SbjTreeItem / SbjTreeTitle이 등록하는 공유 drop target 레지스트리 */
export const treeRegistry = new Map<number, TreeDropTarget>();

/** clientX/Y 위치의 drop target을 찾아 반환. excludeIdx는 drag source */
export const findDropTarget = (
  x: number,
  y: number,
  excludeIdx: number
): { idx: number; dir: BroDir } | null => {
  const el = document.elementFromPoint(x, y);
  for (const [idx, { el: tEl }] of treeRegistry) {
    if (idx !== excludeIdx && tEl.contains(el)) {
      const rect = tEl.getBoundingClientRect();
      return { idx, dir: y > rect.top + rect.height / 2 ? "RIGHT" : "LEFT" };
    }
  }
  return null;
};

/** 모든 drop target의 dir 표시 초기화 */
export const clearAllDirs = () => {
  for (const [, { setDir }] of treeRegistry) setDir(null);
};
