import { createContext } from "react";
import type { useSubject } from "../hooks/useSubject";

type SubjectContextValue = ReturnType<typeof useSubject>;
export const SubjectContext = createContext<SubjectContextValue | null>(null);
