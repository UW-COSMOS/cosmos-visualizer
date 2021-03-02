import h from "react-hyperscript";
import { Route } from "react-router-dom";
import { AppMode } from "~/enum";
import { LandingPageBase, InfoButton } from "~/visualizer-app/landing-page";
import { ViewerPage } from "./page-interface";
import { AppRouter, permalinkRouteTemplate } from "~/shared/router";

const LandingPage = (props) => {
  return h(LandingPageBase, [
    h(
      InfoButton,
      {
        to: "/view-extractions",
        title: "Page-level extractions",
      },
      `Regions of interest extracted and classified for further knowledge-base processing.`
    ),
  ]);
};

const routeTemplate = "/:stackId/page/:imageId";

const App = (props) => {
  const appMode = AppMode.PREDICTION;
  const { publicURL } = props;
  return h(AppRouter, { basename: publicURL, appMode, routeTemplate }, [
    h(Route, {
      path: "/",
      exact: true,
      component: LandingPage,
    }),
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
      path: "/view-extractions/:imageId?",
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
