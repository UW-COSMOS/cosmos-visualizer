import update, {Spec} from 'immutability-helper'

enum SearchBackend {
  ElasticSearch = 'ElasticSearch',
  Anserini = 'Anserini'
}

enum ThresholdKey {
  BaseConfidence = "base_confidence",
  PostprocessingConfidence = "postprocessing_confidence",
  Area = "area"
}

type UpdateQuery = {type: "update-query", query: string}
type UpdateFilter = {type: "update-filter", spec: Spec<FilterParams>}
type SetSearchBackend = {type: "set-search-backend", backend: SearchBackend}
type SetFilterClass = {type: "set-filter-type", featureType: FeatureType|null}
type SetThreshold = {type: "set-threshold", key: ThresholdKey, value: number}
type ToggleFilterPanel = {type: "toggle-filter-panel", value: boolean|undefined}

declare type AppAction =
  | UpdateQuery
  | UpdateFilter
  | SetSearchBackend
  | SetFilterClass
  | SetThreshold
  | ToggleFilterPanel

type AppReducer = (a: AppState, action: AppAction)=> AppState
type AppDispatch = (action: AppAction)=>void

const appReducer: AppReducer = (state, action)=>{
  switch (action.type) {
    case 'update-query':
      const {query} = action
      return appReducer(state, {type: 'update-filter', spec: {query: {$set: query}}})
    case 'update-filter':
      return update(state, {filterParams: action.spec})
    case 'set-search-backend':
      return update(state, {searchBackend: {$set: action.backend}})
    case 'set-filter-type': {
      const ft = action.featureType?.id
      const spec = ft == null ? {$unset: ['type']} : {type: {$set: ft}}
      return appReducer(state, {type: 'update-filter', spec})
    }
    case 'set-threshold': {
      const spec = {[action.key]: {$set: action.value}}
      return appReducer(state, {type: 'update-filter', spec})
    }
    case 'toggle-filter-panel':
      const val = action.value ?? !state.filterPanelOpen
      return update(state, {filterPanelOpen: {$set: val}})
  }
}

export {
  appReducer, AppReducer, AppAction,
  AppDispatch, SearchBackend, ThresholdKey}
