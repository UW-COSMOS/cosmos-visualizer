import "~/shared/_init";
import {
  useAPIResult,
  useAPIHelpers,
  LinkButton,
} from "@macrostrat/ui-components";
import { render } from "react-dom";
import h from "react-hyperscript";
import { Route, useParams } from "react-router-dom";
import { APIProvider } from "~/api";
import { getEnvironmentConfig } from "~/shared/_env";
import { KnowledgeBaseFilterView } from "~/visualizer-app/knowledge-base";
import { AppRouter } from "~/shared/router";
import { ButtonGroup, Button } from "@blueprintjs/core";
import "./main.styl";

const Visualizer = (props) => {
  return h("div.filter-view", [
    h(
      "nav.section-nav",
      null,
      h(LinkButton, { to: "/", icon: "home", minimal: true })
    ),
    h(KnowledgeBaseFilterView, props),
  ]);
  // return h(AppRouter, { basename: publicURL }, [
  //   h(Route, {
  //     path: "/",
  //     exact: true,
  //     component: KnowledgeBaseFilterView,
  //   }),
  // ]);
};

function SetsSelector() {
  const sets = useAPIResult("/sets");
  if (sets == null) return null;
  let { available_sets } = sets;
  // Isn't yet in the lexicon
  available_sets.push("geothermal");
  return h("div.sets-selector", [
    h("h1", "xDD sets"),
    h(
      ButtonGroup,
      { large: true, vertical: true },
      available_sets.map((d) => {
        return h(LinkButton, { to: `/sets/${d}` }, d);
      })
    ),
  ]);
}

function SetVisualizer() {
  const { set } = useParams();
  const base = `https://xdd.wisc.edu/sets/${set}`;
  return h(
    APIProvider,
    { baseURL: `${base}/cosmos/api/v2_beta` },
    h(Visualizer, { setName: set })
  );
}

function App() {
  return h(AppRouter, { basename: "/" }, [
    h(Route, {
      path: "/sets/:set",
      component: SetVisualizer,
    }),
    h(Route, {
      path: "/",
      exact: true,
      component: SetsSelector,
    }),
  ]);
}

const AppHolder = (props) => {
  const { baseURL, imageBaseURL, publicURL, ...rest } = props;
  return h(APIProvider, { baseURL: "https://xdd.wisc.edu" }, h(App));
};

const createUI = function (opts = {}) {
  const env = getEnvironmentConfig(opts);
  // Image base url is properly set here
  const el = document.createElement("div");
  document.body.appendChild(el);
  const __ = h(AppHolder, { ...env });
  return render(__, el);
};

// Actually run the UI (changed for webpack)
createUI();
