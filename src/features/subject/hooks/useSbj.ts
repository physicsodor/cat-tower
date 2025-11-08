import { useSbjState } from "@/features/subject/hooks/useSbjState";
import { useSbjDerived } from "@/features/subject/hooks/useSbjDerived";
import { useSbjCrud } from "@/features/subject/hooks/useSbjCrud";
import { useSbjSelection } from "@/features/subject/hooks/useSbjSelection";
// import { useSbjTree } from "@/features/subject/hooks/useSbjTree";
import { useSbjCnvs } from "@/features/subject/hooks/useSbjCnvs";

export const useSbj = () => {
  const state = useSbjState();
  const derived = useSbjDerived(state.list);
  const crud = useSbjCrud(
    derived.idx2family,
    state.slcSet,
    state.setList,
    state.setSlcSet
  );
  const selection = useSbjSelection(state.slcSet, state.setSlcSet);
  // const tree = useSbjTree(derived.idx2family, state.setList, state.treeDrag);
  const cnvs = useSbjCnvs(derived.idx2chain, state.setList, state.preFrom);

  return {
    ...state,
    ...derived,
    ...crud,
    ...selection,
    // ...tree,
    ...cnvs,
  };
};
