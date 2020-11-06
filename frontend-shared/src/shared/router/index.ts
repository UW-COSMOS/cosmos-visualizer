import h, { compose, C } from "@macrostrat/hyper";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { AppMode } from "~/enum";
import classNames from "classnames";
import { PermalinkProvider } from "./permalinks";
import { DarkModeProvider, inDarkMode } from "@macrostrat/ui-components";

// /annotation/{stack_id}/page/{image_id}

const AppRouterInner = ({ appMode, basename, ...rest }) => {
  const dark = inDarkMode();
  const className = classNames("app-main", { "bp3-dark": dark });

  return h(
    PermalinkProvider,
    { appMode },
    h("div", { className }, [h(Router, { basename }, h(Switch, rest))])
  );
};

const AppRouter = compose(DarkModeProvider, AppRouterInner);

export * from "./permalinks";
export { AppRouter, Route };
