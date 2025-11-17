import { useSbjState } from "@/features/subject/hooks/useSbj.State";
import { useSbjDerived } from "@/features/subject/hooks/useSbj.Derived";
import { useSbjCrud } from "@/features/subject/hooks/useSbj.Crud";
import { useSbjSelection } from "@/features/subject/hooks/useSbj.Selection";
import { useSbjTree } from "./useSbj.Tree";
import { useSbjCnvs } from "./useSbj.Cnvs";
import { useSbjSync } from "./useSbj.Sync";

export const useSbj = () => {
  const state = useSbjState();
  const sync = useSbjSync(state.list, state.setList);
  const derived = useSbjDerived(state.list);
  const crud = useSbjCrud(
    derived.idx2family,
    state.slcSet,
    state.setList,
    state.setSlcSet
  );
  const selection = useSbjSelection(state.slcSet, state.setSlcSet);
  const tree = useSbjTree(derived.idx2family, state.setList, state.treeDrag);
  const cnvs = useSbjCnvs(derived.idx2chain, state.setList, state.preFrom);

  return {
    ...state,
    ...sync,
    ...derived,
    ...crud,
    ...selection,
    ...tree,
    ...cnvs,
  };
};
