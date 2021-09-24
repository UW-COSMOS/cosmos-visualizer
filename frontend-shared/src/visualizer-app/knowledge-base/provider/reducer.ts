import update, { Spec } from "immutability-helper";
import { ScrollMarker } from "@macrostrat/ui-components";

enum SearchBackend {
  ElasticSearch = "ElasticSearch",
  Anserini = "Anserini",
}

enum ThresholdKey {
  BaseConfidence = "base_confidence",
  PostprocessingConfidence = "postprocessing_confidence",
  Area = "area",
}

enum ESSearchLogic {
  Any = "any",
  All = "all",
}

type UpdateState = { type: "update-state"; spec: Spec<AppState> };
type UpdateQuery = { type: "update-query"; query: string };
type UpdateFilter = { type: "update-filter"; spec: Spec<FilterParams> };
type SetSearchBackend = { type: "set-search-backend"; backend: SearchBackend };
type SetFilterClass = {
  type: "set-filter-type";
  featureType: FeatureType | null;
};
type SetThreshold = { type: "set-threshold"; key: ThresholdKey; value: number };
type ToggleFilterPanel = {
  type: "toggle-filter-panel";
  value: boolean | undefined;
};
type ToggleRelatedPanel = {
  type: "toggle-related-panel";
  value: boolean | undefined;
};
type DocumentScrolled = {
  type: "document-scrolled";
  marker: ScrollMarker | null;
};
type SetESSearchLogic = { type: "set-es-search-logic"; value: ESSearchLogic };

declare type AppAction =
  | UpdateState
  | UpdateQuery
  | UpdateFilter
  | SetSearchBackend
  | SetESSearchLogic
  | SetFilterClass
  | SetThreshold
  | ToggleFilterPanel
  | ToggleRelatedPanel
  | DocumentScrolled;

type AppReducer = (a: AppState, action: AppAction) => AppState;
type AppDispatch = (action: AppAction) => void;

const appReducer: AppReducer = (state, action) => {
  switch (action.type) {
    case "update-state":
      return update(state, action.spec);
    case "update-query":
      const { query } = action;
      return update(state, {
        relatedPanelOpen: { $set: true },
        filterParams: { query: { $set: query } },
      });
    case "update-filter":
      return update(state, { filterParams: action.spec });
    case "set-search-backend":
      return update(state, {
        searchBackend: { $set: action.backend },
        filterParams: { $unset: ["search_logic"] },
      });
    case "set-es-search-logic":
      const search_logic = action.value;
      const spec = { search_logic: { $set: search_logic } };
      return appReducer(state, { type: "update-filter", spec });
    case "set-filter-type": {
      const ft = action.featureType?.id;
      const spec = ft == null ? { $unset: ["type"] } : { type: { $set: ft } };
      return appReducer(state, { type: "update-filter", spec });
    }
    case "set-threshold": {
      const spec: Spec<FilterParams> =
        action.value != null
          ? { [action.key]: { $set: action.value } }
          : { $unset: [action.key] };
      return appReducer(state, { type: "update-filter", spec });
    }
    case "toggle-filter-panel": {
      const val = action.value ?? !state.filterPanelOpen;
      return update(state, { filterPanelOpen: { $set: val } });
    }
    case "toggle-related-panel": {
      const val = action.value ?? !state.relatedPanelOpen;
      return update(state, { relatedPanelOpen: { $set: val } });
    }
    case "document-scrolled":
      {
        if (action.marker == null) {
          return update(state, {
            filterPanelOpen: { $set: true },
            relatedPanelOpen: { $set: true },
          });
        }
        switch (action.marker?.id) {
          case "filterPanelOpen":
            return update(state, { filterPanelOpen: { $set: false } });
          case "relatedPanelOpen":
            return update(state, { relatedPanelOpen: { $set: false } });
        }
      }
      return state;
  }
};

export {
  appReducer,
  AppReducer,
  AppAction,
  AppDispatch,
  SearchBackend,
  ThresholdKey,
  ESSearchLogic,
};
