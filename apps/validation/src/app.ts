import h from "react-hyperscript";
import { Route } from "react-router-dom";
import { AppMode } from "~/enum";
import { ViewerPage } from "./page-interface";
import { AppRouter, permalinkRouteTemplate } from "~/shared/router";

const routeTemplate = "/page/:imageId";

const App = (props) => {
  const appMode = AppMode.PREDICTION;
  const { publicURL } = props;
  return h(AppRouter, { basename: publicURL, appMode, routeTemplate }, [
    // Route for permalinks
    h(Route, {
      path: permalinkRouteTemplate(appMode),
      render: (props) => {
        return h(ViewerPage, {
          nextImageEndpoint: "/image/next_prediction",
          subtitleText: "View extractions",
          ...props,
        });
      },
    }),
    // This is probably deprecated
    h(Route, {
      path: "/:imageId?",
      render: (props) => {
        return h(ViewerPage, {
          nextImageEndpoint: "/image/next_prediction",
          subtitleText: "View extractions",
          ...props,
        });
      },
    }),
  ]);
};

export { App };
