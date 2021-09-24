import {
  createContext,
  useEffect,
  useReducer,
  useContext,
  useMemo,
} from "react";
import h from "@macrostrat/hyper";
import { appReducer, AppDispatch, SearchBackend } from "./reducer";
import { useSearchString } from "./query-string";
import { Spec } from "immutability-helper";

let errorMessage = process.env.API_ERROR_MESSAGE;
if (errorMessage == "") errorMessage = null;

const initialState: AppState = {
  filterParams: {
    query: "",
    postprocessing_confidence: 0.72,
    base_confidence: 0.72,
    //postprocessing_confidence: 0.8,
    //area: 50000,
    type: "Figure",
  },
  setName: "Novel coronavirus",
  allowSearch: errorMessage == null,
  errorMessage,
  searchBackend: SearchBackend.ElasticSearch,
  filterPanelOpen: true,
  relatedPanelOpen: true,
};

const AppStateContext = createContext(initialState);
const AppDispatchContext = createContext<AppDispatch>(() => {});
const FeatureClassContext = createContext<FeatureType[]>([]);

function searchBackendForString(string: String): SearchBackend | null {
  for (const s of [SearchBackend.Anserini, SearchBackend.ElasticSearch]) {
    if (s == string) return s;
  }
  return null;
}

type _ = { children: React.ReactChild; types: FeatureType[]; setName: string };
const AppStateProvider = (props: _) => {
  const { types, setName } = props;

  const initialAppState = useMemo(() => {
    return { ...initialState, setName };
  }, [setName]);

  const [value, dispatch] = useReducer(appReducer, initialAppState);

  const [searchString, updateSearchString] = useSearchString();

  useEffect(() => {
    // These are basically hacks for weirdness in the query-string library
    let spec: Spec<AppState> = { filterParams: {} };

    // Crazy way to get the right values from search string
    // Should probably refactor or use some sort of spec
    for (const [k, v] of Object.entries(searchString)) {
      let value = Array.isArray(v) ? v[0] : v;
      if (k == "backend") {
        // Don't set search backend
        //const bk = searchBackendForString(value as String);
        //if (bk != null) spec.searchBackend = { $set: bk };
      } else {
        if (k == "type") {
          // Default to figure if type isn't found
          value = types.find((d) => d.id == (value as String))?.id ?? "Figure";
        }
        spec.filterParams[k] = { $set: value };
      }
    }

    dispatch({ type: "update-state", spec });
  }, []);

  const { filterParams, searchBackend } = value;
  const { query, type, search_logic } = filterParams;

  console.log("Rendering AppStateProvider", value);

  useEffect(() => {
    updateSearchString({ query, type, search_logic });
  }, [filterParams, searchBackend]);

  return h(
    AppStateContext.Provider,
    { value },
    h(
      FeatureClassContext.Provider,
      { value: types },
      h(AppDispatchContext.Provider, { value: dispatch }, props.children)
    )
  );
};

const useAppState = () => useContext(AppStateContext);
const useAppDispatch = () => useContext(AppDispatchContext);
const useTypes = () => useContext(FeatureClassContext);

export { ThresholdKey, SearchBackend, ESSearchLogic } from "./reducer";
export { AppStateProvider, useAppState, useAppDispatch, useTypes };
