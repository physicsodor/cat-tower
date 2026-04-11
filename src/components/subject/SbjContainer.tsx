import { SbjProvider } from "@/store/SbjProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjTree from "./SbjTree/SbjTree";
import SbjAuthPanel from "./SbjAuthPanel";
import SbjEditModal from "./SbjEditModal";
import { ProjectPickerModal } from "./ProjectPicker/ProjectPickerModal";
import SbjCtrlBtns from "./SbjCtrlBtns";
import TagTypePanel from "./TagTypePanel";

const SbjContainer = () => {
  return (
    <SbjProvider>
      <SbjAuthPanel />
      <SbjTree />
      <SbjCnvs />
      <SbjCtrlBtns />
      <SbjEditModal />
      <ProjectPickerModal />
      <TagTypePanel />
    </SbjProvider>
  );
};

export default SbjContainer;
