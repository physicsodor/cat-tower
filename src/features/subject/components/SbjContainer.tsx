import { SbjProvider } from "@/features/subject/context/SbjProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjCtrl from "./SbjCtrl/SbjCtrl";
// import SbjTest from "./SbjTest";

const SubjectContainer = () => {
  return (
    <SbjProvider>
      <SbjCtrl />
      {/* <SbjTest /> */}
      <SbjCnvs />
    </SbjProvider>
  );
};

export default SubjectContainer;
