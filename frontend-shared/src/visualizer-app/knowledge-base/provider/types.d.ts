type FeatureClass = {id: string, name: string}

type FilterParams = {
  query: string,
  base_confidence: number,
  postprocessing_confidence: number,
  area: number,
  class?: FeatureClass
}

interface AppState {
  filterParams: FilterParams,
  searchBackend: import("./reducer").SearchBackend
}
