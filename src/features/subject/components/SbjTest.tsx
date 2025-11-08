import { useSbjStore } from "../context/SbjContext";

const SbjTest = () => {
  const { idx2family } = useSbjStore();

  return (
    <div>
      {[...idx2family].map(([i, x]) => (
        <div>{JSON.stringify({ idx: i, ...x })}</div>
      ))}
    </div>
  );
};

export default SbjTest;
