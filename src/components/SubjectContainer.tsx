import { SubjectProvider } from "../context/SubjectProvider";
import SbjCnvs from "./SbjCnvs/SbjCnvs";
import SbjCtrl from "./SbjCtrl/SbjCtrl";
// import SbjTest from "./SbjTest";
import SbjTree from "./SbjTree/SbjTree";

const SubjectContainer = () => {
  return (
    <SubjectProvider>
      <SbjCtrl />
      <SbjTree />
      {/* <SbjTest /> */}
      <SbjCnvs />
    </SubjectProvider>
  );
};

export default SubjectContainer;
