import { SbjProvider } from "@/features/subject/context/SbjProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjTree from "./SbjTree/SbjTree";
import SbjAuthPanel from "./SbjAuthPanel";
import SbjEditModal from "./SbjEditModal";

const SbjContainer = () => {
  return (
    <SbjProvider>
      <SbjAuthPanel />
      <SbjTree />
      <SbjCnvs />
      <SbjEditModal />
    </SbjProvider>
  );
};

export default SbjContainer;
