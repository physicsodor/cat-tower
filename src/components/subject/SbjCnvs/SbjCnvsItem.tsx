import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SbjCnvsTitle from "./SbjCnvsTitle";
import SbjCnvsCurve from "./SbjCnvsCurve";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjData } from "@/store/SbjDataContext";
import { useSbjSelect } from "@/store/SbjSelectContext";
import {
  renderMarkup,
  stripMarkup,
  truncateBytes,
} from "@/components/TextEditor/markup";
import { CONTENT_PREVIEW_BYTES } from "@/lib/constants";
import BttnPin from "@/components/Bttn/BttnPin";

type PE = React.PointerEvent | PointerEvent;

const getDesc = (info: { content: string }): string => {
  if (info.content) {
    const plain = stripMarkup(info.content).trim();
    return plain
      ? truncateBytes(plain, CONTENT_PREVIEW_BYTES, "...")
      : "내용 없음";
  }
  return "내용 없음";
};
type Props = {
  setRef: (e: HTMLDivElement) => void;
  idx: number;
  info: {
    title: string;
    short?: string;
    content: string;
    x: number;
    y: number;
  };
  dxy: { dx: number; dy: number };
  camera: { x: number; y: number; zoom: number };
  isSelected: boolean;
  isHovered: boolean;
  isPre: boolean;
  isNxt: boolean;
  isNon: boolean;
  isPinned: boolean;
  horizontal: boolean;
  onHoverChange: (idx: number | null) => void;
  onPinToggle: (idx: number) => void;
};

const SbjCnvsItem = ({
  setRef,
  idx,
  info,
  dxy: { dx, dy },
  camera,
  isSelected,
  isHovered,
  isPre,
  isNxt,
  isNon,
  isPinned,
  horizontal,
  onHoverChange,
  onPinToggle,
}: Props) => {
  const {
    setCnvsPre,
    preSource,
    openEdit,
    removePreLink,
    setTreeMom,
    exitTreeMom,
    idx2chain,
    idx2sbj,
    idx2family,
  } = useSbjData();
  const { selectedSet } = useSbjSelect();
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isOver, setIsOver] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{
    type: "in" | "out";
    x: number;
    y: number;
  } | null>(null);
  const [exitCtxMenu, setExitCtxMenu] = useState<{
    x: number;
    y: number;
    grandmom: number;
    showAll: boolean;
  } | null>(null);
  const outRef = useRef<HTMLDivElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const desc = useMemo(() => getDesc(info), [info]);

  const getSourcePos = useCallback(() => {
    if (!outRef.current) return { x: 0, y: 0 };
    const rect = outRef.current.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const onGlobalMove = useCallback((e: PE) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const onGlobalUp = useCallback(() => {
    setMousePos(null);
    preSource.set(-1);
    window.removeEventListener("pointermove", onGlobalMove);
    window.removeEventListener("pointerup", onGlobalUp);
    window.removeEventListener("pointercancel", onGlobalUp);
  }, [onGlobalMove, preSource]);

  const onDown = useCallback(
    (e: PE) => {
      if (e.button !== 0) return;
      e.preventDefault();
      preSource.set(idx);
      window.addEventListener("pointermove", onGlobalMove);
      window.addEventListener("pointerup", onGlobalUp);
      window.addEventListener("pointercancel", onGlobalUp);
    },
    [onGlobalMove, onGlobalUp, preSource, idx],
  );

  const onUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setCnvsPre(idx);
    },
    [idx, setCnvsPre],
  );

  const onItemPointerDown = useCallback(
    (e: React.PointerEvent) => {
      longPressStart.current = { x: e.clientX, y: e.clientY };
      hasMoved.current = false;
      if (e.pointerType !== "touch") return;
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        openEdit(idx);
      }, 500);
    },
    [idx, openEdit],
  );

  const onItemPointerMove = useCallback((e: React.PointerEvent) => {
    if (!longPressStart.current) return;
    const dx = e.clientX - longPressStart.current.x;
    const dy = e.clientY - longPressStart.current.y;
    if (Math.hypot(dx, dy) > 8) {
      hasMoved.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const onItemPointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStart.current = null;
  }, []);

  const onDoubleClick = useCallback(() => {
    if (hasMoved.current) return;
    openEdit(idx);
  }, [idx, openEdit]);

  const onInContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pre = idx2chain.get(idx)?.pre;
      if (!pre || pre.size === 0) return;
      setCtxMenu({ type: "in", x: e.clientX, y: e.clientY });
    },
    [idx, idx2chain],
  );

  const onOutContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const nxt = idx2chain.get(idx)?.nxt;
      if (!nxt || nxt.size === 0) return;
      setCtxMenu({ type: "out", x: e.clientX, y: e.clientY });
    },
    [idx, idx2chain],
  );

  const onMenuItemClick = useCallback(
    (otherIdx: number) => {
      if (!ctxMenu) return;
      if (ctxMenu.type === "in") removePreLink(idx, otherIdx);
      else removePreLink(otherIdx, idx);
      setCtxMenu(null);
    },
    [ctxMenu, idx, removePreLink],
  );

  useEffect(() => {
    if (!ctxMenu && !exitCtxMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtxMenu(null);
        setExitCtxMenu(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ctxMenu, exitCtxMenu]);

  const onBodyContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const f = idx2family.get(idx);
      if (!f || f.mom === undefined || f.mom === -1) return;
      const grandmom = idx2family.get(f.mom)?.mom ?? -1;
      setExitCtxMenu({
        x: e.clientX,
        y: e.clientY,
        grandmom,
        showAll: selectedSet.has(idx),
      });
    },
    [idx, idx2family, selectedSet],
  );

  const ctxItems = useMemo(() => {
    if (!ctxMenu) return [];
    const idxs =
      ctxMenu.type === "in"
        ? Array.from(idx2chain.get(idx)?.pre ?? [])
        : Array.from(idx2chain.get(idx)?.nxt ?? []);
    return idxs.map((i) => {
      const sbj = idx2sbj.get(i);
      const label = sbj
        ? sbj.sbjType === "SUBJECT" && sbj.short
          ? sbj.short
          : sbj.title
        : `#${i}`;
      return { idx: i, label };
    });
  }, [ctxMenu, idx, idx2chain, idx2sbj]);

  const viewX = camera.x + (horizontal ? info.y : info.x) * camera.zoom + dx;
  const viewY = camera.y + (horizontal ? info.x : info.y) * camera.zoom + dy;

  return (
    <div
      onMouseOver={() => {
        setIsOver(true);
        onHoverChange(idx);
      }}
      onMouseLeave={() => {
        setIsOver(false);
        onHoverChange(null);
      }}
    >
      <div
        ref={setRef}
        className={makeClassName(
          "sbj-cnvs-item",
          isSelected && "-slc",
          isHovered && "-hvr",
          isPre && "-pre",
          isNxt && "-nxt",
          isNon && "-non",
          isPinned && "-pin",
          horizontal && "-h",
        )}
        style={{
          transform: `translate(${viewX}px, ${viewY}px) scale(${camera.zoom}) translate(-50%, -50%)`,
        }}
        onDoubleClick={onDoubleClick}
        onPointerDown={onItemPointerDown}
        onPointerMove={onItemPointerMove}
        onPointerUp={onItemPointerUp}
        onPointerCancel={onItemPointerUp}
        onContextMenu={onBodyContextMenu}
      >
        {isOver ? (
          <div className="sbj-cnvs-item-sum">
            <div>{renderMarkup(info.title)}</div>
            <div>{desc}</div>
          </div>
        ) : null}
        <div className="sbj-cnvs-item-acts">
          <BttnPin
            className="-no-bck"
            isActive={isPinned}
            onClick={() => onPinToggle(idx)}
          />
        </div>
        <div
          className="sbj-cnvs-item-in"
          onPointerUp={onUp}
          onContextMenu={onInContextMenu}
        />
        <SbjCnvsTitle idx={idx} title={info.short || info.title} />
        <div
          ref={outRef}
          className="sbj-cnvs-item-out"
          onPointerDown={onDown}
          onContextMenu={onOutContextMenu}
        />
      </div>
      <SbjCnvsCurve
        sourcePos={getSourcePos()}
        mousePos={mousePos}
        zoom={camera.zoom}
        horizontal={horizontal}
      />
      {exitCtxMenu && (
        <>
          <div
            className="sbj-cnvs-ctx-overlay"
            onPointerDown={() => setExitCtxMenu(null)}
          />
          <div
            className="sbj-cnvs-ctx-menu"
            style={{ left: exitCtxMenu.x, top: exitCtxMenu.y }}
          >
            <div
              className="sbj-cnvs-ctx-menu-item"
              onPointerDown={(e) => {
                e.stopPropagation();
                setTreeMom(new Set([idx]), exitCtxMenu.grandmom);
                setExitCtxMenu(null);
              }}
            >
              이 항목을 그룹에서 제외
            </div>
            {exitCtxMenu.showAll && (
              <div
                className="sbj-cnvs-ctx-menu-item"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  exitTreeMom(selectedSet);
                  setExitCtxMenu(null);
                }}
              >
                선택한 모든 항목을 그룹에서 제외
              </div>
            )}
          </div>
        </>
      )}
      {ctxMenu && (
        <>
          <div
            className="sbj-cnvs-ctx-overlay"
            onPointerDown={() => setCtxMenu(null)}
          />
          <div
            className="sbj-cnvs-ctx-menu"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            {ctxItems.map((item) => (
              <div
                key={item.idx}
                className="sbj-cnvs-ctx-menu-item"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onMenuItemClick(item.idx);
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SbjCnvsItem;
