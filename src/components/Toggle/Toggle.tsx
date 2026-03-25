import { useState } from "react";
import styles from "./Toggle.module.scss";

interface ToggleProps {
  offLabel?: string;
  onLabel?: string;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
}

export function Toggle({ offLabel, onLabel, defaultOn = false, onChange }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);

  function handleClick() {
    const next = !on;
    setOn(next);
    onChange?.(next);
  }

  if (offLabel !== undefined || onLabel !== undefined) {
    return (
      <div
        className={`${styles.labeled} ${on ? styles.on : ""}`}
        onClick={handleClick}
        role="switch"
        aria-checked={on}
      >
        <span className={`${styles.labelItem} ${!on ? styles.activeLabel : ""}`}>
          {offLabel}
        </span>
        <span className={`${styles.labelItem} ${on ? styles.activeLabel : ""}`}>
          {onLabel}
        </span>
        <span className={styles.labelKnob} />
      </div>
    );
  }

  return (
    <button
      className={`${styles.slot} ${on ? styles.on : ""}`}
      onClick={handleClick}
      role="switch"
      aria-checked={on}
    >
      <span className={styles.knob} />
    </button>
  );
}
