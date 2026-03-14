import { SbjProvider } from "@/features/subject/context/SbjProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjTree from "./SbjTree/SbjTree";
import SbjAuthPanel from "./SbjAuthPanel";
import SbjEditModal from "./SbjEditModal";
import { ProjectPickerModal } from "./ProjectPicker/ProjectPickerModal";
import SbjCtrlBtns from "./SbjCtrlBtns";

const SbjContainer = () => {
  return (
    <SbjProvider>
      <SbjAuthPanel />
      <SbjTree />
      <SbjCnvs />
      <SbjCtrlBtns />
      <SbjEditModal />
      <ProjectPickerModal />
    </SbjProvider>
  );
};

export default SbjContainer;
