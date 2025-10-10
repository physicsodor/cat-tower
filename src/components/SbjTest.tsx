import { useSubjectStore } from "../context/useSubjectStore";

const SbjTest = () => {
  const { idx2family } = useSubjectStore();

  return (
    <div>
      {[...idx2family].map(([i, x]) => (
        <div>{JSON.stringify({ idx: i, ...x })}</div>
      ))}
    </div>
  );
};

export default SbjTest;
