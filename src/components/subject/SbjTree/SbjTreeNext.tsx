import { useEffect, useRef, useState } from "react";
import { makeClassName } from "@/utils/makeClassName";
import { useSbjData } from "@/store/SbjDataContext";
import { treeRegistry } from "./treeRegistry";

type Props = { idx: number };

const SbjTreeNext = ({ idx }: Props) => {
  const { setTreeBro } = useSbjData();
  const [isOn, setIsOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = -(idx + 1); // SbjTreeItem/Title와 key 충돌 방지 (음수)
    if (ref.current)
      treeRegistry.set(key, {
        el: ref.current,
        setDir: (d) => setIsOn(d !== null),
        onDrop: (dragged) => setTreeBro(dragged, idx, "RIGHT"),
      });
    return () => {
      treeRegistry.delete(key);
    };
  });

  return (
    <div
      ref={ref}
      className={makeClassName("sbj-tree-next", "-ovr", isOn && "-nxt")}
    >
      <div className="sbj-tree-contents" />
    </div>
  );
};
export default SbjTreeNext;
