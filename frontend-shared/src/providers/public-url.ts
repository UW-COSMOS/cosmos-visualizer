/*
TODO: The public URL context here is a shim for poor functionality
in permalinks etc. and should be eventually removed.
*/
import h from "@macrostrat/hyper";
import { createContext } from "react";

interface PublicURLCtx {
  publicURL: string;
}

const PublicURLContext = createContext<PublicURLCtx>({ publicURL: "/" });

interface PublicURLProps extends PublicURLCtx {
  children?: React.ReactNode;
}

const PublicURLProvider = (props: PublicURLProps) => {
  const { publicURL, children } = props;
  const value = { publicURL };
  return h(PublicURLContext.Provider, { value }, children);
};

export { PublicURLProvider, PublicURLContext };
