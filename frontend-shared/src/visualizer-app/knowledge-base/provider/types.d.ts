type FeatureType = { id: string; name: string };

type FilterParams = {
  query: string;
  base_confidence?: number;
  postprocessing_confidence?: number;
  area?: number;
  type?: string;
};

interface AppMainState {
  setName: string;
  filterParams: FilterParams;
  filterPanelOpen: boolean;
  relatedPanelOpen: boolean;
  scrollOffset: number;
  searchBackend: import("./reducer").SearchBackend;
}

interface AppErrorState {
  errorMessage: string;
  allowSearch: boolean;
}

type AppState = AppMainState & AppErrorState;
