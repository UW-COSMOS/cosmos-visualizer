import h, { compose, C } from "@macrostrat/hyper";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import classNames from "classnames";
import { PermalinkProvider } from "./permalinks";
import { DarkModeProvider, inDarkMode } from "@macrostrat/ui-components";

const AppRouterInner = ({ routeTemplate, basename, ...rest }) => {
  const dark = inDarkMode();
  const className = classNames("app-main", { "bp3-dark": dark });

  return h(
    PermalinkProvider,
    { routeTemplate },
    h("div", { className }, [h(Router, { basename }, h(Switch, rest))])
  );
};

const AppRouter = compose(DarkModeProvider, AppRouterInner);

export * from "./permalinks";
export { AppRouter, Route };
