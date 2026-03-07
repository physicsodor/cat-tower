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
    state.selectedSet,
    state.setList,
    state.setSelectedSet
  );
  const selection = useSbjSelection(state.selectedSet, state.setSelectedSet);
  const tree = useSbjTree(derived.idx2family, state.setList, state.treeDrag);
  const cnvs = useSbjCnvs(derived.idx2chain, state.setList, state.preSource);

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
