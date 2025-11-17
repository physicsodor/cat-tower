import { SbjProvider } from "@/features/subject/context/SbjProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjTree from "./SbjTree/SbjTree";
// import SbjTest from "./SbjTest";

const SubjectContainer = () => {
  return (
    <SbjProvider>
      <SbjTree />
      {/* <SbjTest /> */}
      <SbjCnvs />
    </SbjProvider>
  );
};

export default SubjectContainer;
