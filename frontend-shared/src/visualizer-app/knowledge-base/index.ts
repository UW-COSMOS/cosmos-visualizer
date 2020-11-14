import h from "@macrostrat/hyper";
import {
  InfiniteScrollView,
  APIResultProps,
  DarkModeButton,
  useAPIView,
  useAPIResult,
} from "@macrostrat/ui-components";
import { Spinner, Intent } from "@blueprintjs/core";
import { DocumentExtraction } from "./model-extraction";
import { SearchInterface } from "./search-interface";
import { FilterPanel } from "./filter-panel";
import { AppStateProvider, useAppState } from "./provider";
import { RelatedTerms } from "./related-terms";
import { Placeholder } from "./placeholder";
import { Footer } from "../landing-page";
import { format } from "d3-format";
import queryString from "query-string";
import "./main.styl";

const fmt = format(",.0f");

// TODO: Trial queries should be provided by the API
const trialQueries = [
  "incidence rate",
  "ACE2",
  "coronavirus lungs",
  "opacity",
  "peak infections",
  "death rate",
];

const TrialQueries = (props) => {
  return h(
    "ul.trial-queries",
    trialQueries.map((d, i) => {
      const qstr = queryString.stringify({ query: d });
      return h("li", { key: i }, h("a", { href: "?" + qstr }, d));
    })
  );
};

const PlaceholderDescription = () => {
  const res = useAPIResult("/statistics");
  const { setName } = useAppState();
  const description = h([
    h("p", "Enter a query to search. Or try one of these examples:"),
    h(TrialQueries),
  ]);
  if (res == null) {
    return h("div.description", [
      h("div.desc-spinner", null, h(Spinner, { size: 20 })),
      description,
    ]);
  }
  return h("div.description", [
    h("p", [
      "The ",
      // TODO: Make sure we add this to the "statistics" API.
      h("b", setName),
      ` knowledge base consists of ${fmt(res.n_objects)}
        entities extracted from ${fmt(res.n_pdfs)} scientific publications.`,
    ]),
    description,
  ]);
};

const APINotAvailable = () => {
  const { errorMessage } = useAppState();
  return h(Placeholder, {
    icon: "error",
    intent: Intent.DANGER,
    title: "COSMOS API Error",
    description: errorMessage,
  });
};

const StartingPlaceholder = (props) => {
  const { errorMessage } = useAppState();
  if (errorMessage != null) {
    // Return an error placeholder overriding the entire application state
    return h(APINotAvailable);
  }

  return h(Placeholder, {
    icon: "search-template",
    title: "COSMOS visualizer",
    description: h(PlaceholderDescription),
  });
};

const LoadingPlaceholder = (props: { perPage: number }) => {
  const { perPage } = props;
  const ctx = useAPIView();
  const page = ctx.params?.page ?? 0;

  let computedPageCount = null;
  if (perPage != null && ctx.totalCount != null) {
    computedPageCount = Math.ceil(ctx.totalCount / perPage);
  }
  const pageCount = ctx.pageCount ?? computedPageCount;

  let desc = null;
  if (page >= 1) {
    desc = `Page ${page + 1}`;
    if (pageCount != null) desc += ` of ${pageCount}`;
  }

  const { errorMessage } = useAppState();
  if (errorMessage != null) {
    // Return an error placeholder overriding the entire application state
    return h(APINotAvailable);
  }

  return h(Placeholder, {
    icon: h(Spinner),
    title: "Loading extractions",
    description: desc,
  });
};

LoadingPlaceholder.defaultProps = { perPage: 10 };

type ResProps = APIResultProps<APIDocumentResult[]>;

const DocumentResults = (props: ResProps) => {
  const data = props.data ?? [];
  const { isLoading } = props;
  if (data.length == 0 && !isLoading)
    return h(Placeholder, {
      icon: "inbox",
      title: "No results",
      description: "No matching extractions found",
    });

  const offset = 0;

  return h([
    h(
      "div.documents",
      data.map((d, i) => {
        return h(DocumentExtraction, { key: i, data: d, index: i });
      })
    ),
    h.if(isLoading)(LoadingPlaceholder),
  ]);
};

const ResultsView = (props) => {
  const { filterParams, searchBackend } = useAppState();

  const { query } = filterParams;
  const queryNotSet = query == null || query == "";

  // We used to parameterize these by search backend but now there's no need
  let route = "/search";
  const countRoute = "/count";
  // Get query count as separate transaction for Anserini backend

  const res = useAPIResult(countRoute, filterParams);
  const count = res?.total_results;

  if (queryNotSet) {
    return h("div.results", null, h(StartingPlaceholder));
  }

  return h(
    InfiniteScrollView,
    {
      className: "results",
      route,
      opts: {
        unwrapResponse(res) {
          return res;
        },
      },
      params: filterParams,
      totalCount: count,
      getCount(res) {
        return res.total;
      },
      getNextParams(res, params) {
        return { ...params, page: (res.page ?? -1) + 1 };
      },
      getItems(res) {
        return res.objects;
      },
      hasMore(res) {
        return res.objects.length > 0;
      },
    },
    h(DocumentResults)
  );
};

interface KBProps {
  types: any[];
  setName: string;
  word2VecAPIBaseURL?: string;
}

const SearchInterfaceView = (props: KBProps) => {
  const {
    types,
    setName = "novel coronavirus",
    // Should get rid of this default or push higher up...
    word2VecAPIBaseURL,
  } = props;
  return h(
    AppStateProvider,
    { types, setName },
    h("div#knowledge-base-filter.main", [
      h("div.corner-controls", [h(DarkModeButton, { minimal: true })]),
      h(SearchInterface, [
        h(FilterPanel),
        // Related terms only loads if its API Base URL is defined...
        h.if(word2VecAPIBaseURL != null)(RelatedTerms, {
          baseURL: word2VecAPIBaseURL,
        }),
      ]),
      h(ResultsView),
      h(Footer),
    ])
  );
};

SearchInterfaceView.defaultProps = {
  types: [
    { id: "Figure", name: "Figure" },
    { id: "Table", name: "Table" },
    { id: "Equation", name: "Equation" },
    //{ id: "Body Text", name: "Body Text" },
  ],
};

const KnowledgeBaseFilterView = (props: KBProps) => {
  return h(SearchInterfaceView, props);
};

export { KnowledgeBaseFilterView };
