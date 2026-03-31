import { useSbjData } from "@/store/SbjDataContext";

const SbjTest = () => {
  const { idx2family } = useSbjData();

  return (
    <div>
      {[...idx2family].map(([i, x]) => (
        <div>{JSON.stringify({ idx: i, ...x })}</div>
      ))}
    </div>
  );
};

export default SbjTest;
