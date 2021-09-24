import "~/shared/_init";
import { LinkButton } from "@macrostrat/router-components";
import { useAPIResult } from "@macrostrat/ui-components";
import { render } from "react-dom";
import h from "@macrostrat/hyper";
import { Route, useParams } from "react-router-dom";
import { APIProvider } from "~/api";
import { Word2VecAPIProvider } from "~/related-terms";
import { KnowledgeBaseFilterView } from "~/visualizer-app/knowledge-base";
import { AppRouter } from "~/shared/router";
import { ButtonGroup } from "@blueprintjs/core";
import "./main.styl";

const baseURL = process.env.XDD_BASE_URL ?? "https://xdd.wisc.edu";
/* Add API Key to global API params if exists */
const apiKey = process.env.XDD_API_KEY;
let globalParams = {};
if (apiKey != null) globalParams.api_key = apiKey;

function SetsSelector() {
  const sets: any = useAPIResult(baseURL + "/sets");
  if (sets == null) return null;
  const { available_sets } = sets;

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

function CosmosProviderStack({ setBaseURL, children }) {
  return h(
    APIProvider,
    {
      baseURL: setBaseURL + "/cosmos/api",
      params: globalParams,
    },
    h(
      Word2VecAPIProvider,
      {
        baseURL: setBaseURL + `/word2vec/api/`,
      },
      children
    )
  );
}

function SetVisualizer() {
  const { set } = useParams();
  return h(
    CosmosProviderStack,
    { setBaseURL: baseURL + "/sets/" + set },
    h(KnowledgeBaseFilterView, {
      setName: set,
      types: [
        { id: "Figure", name: "Figure" },
        { id: "Table", name: "Table" },
        { id: "Equation", name: "Equation" },
      ],
    })
  );
}

function App() {
  const basename = process.env.PUBLIC_URL || "/";
  return h(AppRouter, { basename }, [
    h(Route, {
      path: "/sets/:set",
      component: SetVisualizer,
    }),
    h(Route, {
      path: "/",
      component: SetsSelector,
    }),
  ]);
}

function createUI() {
  // This app doesn't have any environment configuration options
  // Image base url is properly set here
  const el = document.createElement("div");
  document.body.appendChild(el);
  return render(h(App), el);
}

// Actually run the UI (changed for webpack)
createUI();
