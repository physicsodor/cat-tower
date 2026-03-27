import { createPortal } from "react-dom";
import "./Popup.scss";

interface PopupProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Popup = ({ onClose, children, className }: PopupProps) => {
  return createPortal(
    <div
      className={["popup-overlay", className].filter(Boolean).join(" ")}
      onPointerDown={onClose}
    >
      <div onPointerDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};
