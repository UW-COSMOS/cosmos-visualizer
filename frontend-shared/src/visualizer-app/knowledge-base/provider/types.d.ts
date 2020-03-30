type FeatureType = {id: string, name: string}

type FilterParams = {
  query: string,
  base_confidence: number,
  postprocessing_confidence: number,
  area: number,
  type?: string
}

interface AppState {
  filterParams: FilterParams,
  filterPanelOpen: boolean,
  searchBackend: import("./reducer").SearchBackend
}
