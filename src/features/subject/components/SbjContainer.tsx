import { SbjProvider } from "@/features/subject/context/SbjProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjTree from "./SbjTree/SbjTree";
import SbjAuthPanel from "./SbjAuthPanel";

const SubjectContainer = () => {
  return (
    <SbjProvider>
      <SbjAuthPanel />
      <SbjTree />
      <SbjCnvs />
    </SbjProvider>
  );
};

export default SubjectContainer;
