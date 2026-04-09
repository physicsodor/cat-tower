import { useState } from "react";
import { createPortal } from "react-dom";
import BttnCopy from "@/components/Bttn/BttnCopy";

type Props = {
  url: string;
  onClose: () => void;
  onLogin?: (provider: "google" | "kakao") => void;
};

const SbjShareModal = ({ url, onClose, onLogin }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return createPortal(
    <div className="share-overlay" onPointerDown={onClose}>
      <div className="share-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="share-url-row">
          <span className="share-url">{url}</span>
          <BttnCopy onDown={handleCopy} />
        </div>
        {copied && <div className="share-copied">복사됨!</div>}
        {onLogin && (
          <div className="share-login-row">
            <span className="share-or">또는</span>
            <button className="sbj-auth-btn" onClick={() => onLogin("google")}>Google 로그인</button>
            <button className="sbj-auth-btn" onClick={() => onLogin("kakao")}>카카오 로그인</button>
          </div>
        )}
        <div className="share-btns">
          <button className="sbj-auth-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SbjShareModal;
