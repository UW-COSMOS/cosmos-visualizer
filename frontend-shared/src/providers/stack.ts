import h from "@macrostrat/hyper";
import { createContext, useContext } from "react";

const StackContext = createContext<string | null>(null);

const StackProvider = (props: {
  children: React.ReactNode;
  stack: string | null;
}) => {
  const { children, stack } = props;
  const value = {
    actions: {},
  };
  return h(StackContext.Provider, { value: stack }, children);
};

const useStack = () => useContext(StackContext);

export { StackProvider, useStack };
