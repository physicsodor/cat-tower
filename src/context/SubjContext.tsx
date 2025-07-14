import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { SubjAct, SubjState } from "../types/SubjType";
import { SubjIni, subjReducer } from "./SubjReducer";

type SubjContextType = {
  state: SubjState;
  dispatch: Dispatch<SubjAct>;
};

const SubjContext = createContext<SubjContextType | null>(null);

export function SubjProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(subjReducer, SubjIni);
  return (
    <SubjContext.Provider value={{ state, dispatch }}>
      {children}
    </SubjContext.Provider>
  );
}

export function useSubjContext() {
  const context = useContext(SubjContext);
  if (!context) throw new Error("SubjContext is not within provider.");
  return context;
}
