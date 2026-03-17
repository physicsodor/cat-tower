import { useCallback, useMemo, useRef, useState } from "react";
import SbjCnvsTitle from "./SbjCnvsTitle";
import SbjCnvsCurve from "./SbjCnvsCurve";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjData } from "../../store/SbjDataContext";
import { renderMarkup, stripMarkup, truncateBytes } from "../../utils/markup";
import { CONTENT_PREVIEW_BYTES } from "@/features/subject/constants";

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
  onHoverChange: (idx: number | null) => void;
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
  onHoverChange,
}: Props) => {
  const {
    setCnvsPre,
    preSource,
    delSbjOne,
    openEdit,
    removePreLink,
    idx2chain,
    idx2sbj,
  } = useSbjData();
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isOver, setIsOver] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{
    type: "in" | "out";
    x: number;
    y: number;
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

  const viewX = camera.x + info.x * camera.zoom + dx;
  const viewY = camera.y + info.y * camera.zoom + dy;

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
        )}
        style={{
          transform: `translate(${viewX}px, ${viewY}px) scale(${camera.zoom}) translate(-50%, -50%)`,
        }}
        onDoubleClick={onDoubleClick}
        onPointerDown={onItemPointerDown}
        onPointerMove={onItemPointerMove}
        onPointerUp={onItemPointerUp}
        onPointerCancel={onItemPointerUp}
      >
        {isOver ? (
          <div className="sbj-cnvs-item-sum">
            <div>{renderMarkup(info.title)}</div>
            <div>{desc}</div>
          </div>
        ) : null}
        <div className="sbj-cnvs-item-acts">
          <button
            className="sbj-cnvs-item-act -edt"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => openEdit(idx)}
          >
            ✱
          </button>
          <button
            className="sbj-cnvs-item-act -del"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => delSbjOne(idx)}
          >
            ✕
          </button>
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
      />
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
