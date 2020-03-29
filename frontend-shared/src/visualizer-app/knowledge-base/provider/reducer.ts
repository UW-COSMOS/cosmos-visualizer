import update, {Spec} from 'immutability-helper'

declare type FilterParams = {
  query: string,
  base_confidence: number,
  postprocessing_confidence: number,
  area: number
}

enum SearchBackend {
  ElasticSearch = 'ElasticSearch',
  Anserini = 'Anserini'
}

declare interface AppState {
  filterParams: FilterParams,
  searchBackend: SearchBackend
}


type UpdateQuery = {type: "update-query", query: string}
type UpdateFilter = {type: "update-filter", spec: Spec<FilterParams>}
type SetSearchBackend = {type: "set-search-backend", backend: SearchBackend}

declare type AppAction =
  | UpdateQuery
  | UpdateFilter
  | SetSearchBackend

declare type AppReducer = (a: AppState, action: AppAction)=> AppState

const appReducer: AppReducer = (state, action)=>{
  switch (action.type) {
    case 'update-query':
      const {query} = action
      return appReducer(state, {type: 'update-filter', spec: {query: {$set: query}}})
    case 'update-filter':
      return update(state, {filterParams: action.spec})
    case 'set-search-backend':
      return update(state, {searchBackend: {$set: action.backend}})
  }
}

export {appReducer, AppReducer, AppAction, FilterParams, SearchBackend, AppState}
