import update, {Spec} from 'immutability-helper'

enum SearchBackend {
  ElasticSearch = 'ElasticSearch',
  Anserini = 'Anserini'
}

type UpdateQuery = {type: "update-query", query: string}
type UpdateFilter = {type: "update-filter", spec: Spec<FilterParams>}
type SetSearchBackend = {type: "set-search-backend", backend: SearchBackend}

declare type AppAction =
  | UpdateQuery
  | UpdateFilter
  | SetSearchBackend

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
  }
}

export {appReducer, AppReducer, AppAction, AppDispatch, SearchBackend}
