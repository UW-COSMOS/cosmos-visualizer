import {createContext, useEffect, useReducer, useContext} from 'react'
import h from '@macrostrat/hyper'
import {appReducer, AppDispatch, SearchBackend} from './reducer'
import {useSearchString} from "./query-string"
import {Spec} from 'immutability-helper'

let errorMessage = process.env.API_ERROR_MESSAGE
if (errorMessage == "") errorMessage = null

const initialState: AppState = {
  filterParams: {
    query: "",
    postprocessing_confidence: 0.72,
    base_confidence: 0.72,
    //postprocessing_confidence: 0.8,
    //area: 50000,
    type: "Figure"
  },
  allowSearch: errorMessage == null,
  errorMessage,
  searchBackend: SearchBackend.Anserini,
  filterPanelOpen: true,
  relatedPanelOpen: true,
  scrollOffset: 0
}

const AppStateContext = createContext(initialState)
const AppDispatchContext = createContext<AppDispatch>(()=>{})
const FeatureClassContext = createContext<FeatureType[]>([])

function searchBackendForString(string: String): SearchBackend|null {
  for (const s of [SearchBackend.Anserini, SearchBackend.ElasticSearch]) {
    if (s == string) return s
  }
  return null
}

type _ = {children: React.ReactChild, types: FeatureType[]}
const AppStateProvider = (props: _)=>{
  const {types} = props

  const [value, dispatch] = useReducer(appReducer, initialState)

  const [searchString, updateSearchString] = useSearchString()

  useEffect(()=>{
    // These are basically hacks for weirdness in the query-string library
    let spec: Spec<AppState> = {filterParams: {}}

    // Crazy way to get the right values from search string
    // Should probably refactor or use some sort of spec
    for (const [k,v] of Object.entries(searchString)) {
      let value = Array.isArray(v) ? v[0] : v
      if (k == 'backend') {
        const bk = searchBackendForString(value as String)
        if (bk != null) spec.searchBackend = {$set: bk}
      } else {
        if (k == 'type') {
          // Default to figure if type isn't found
          value = types.find(d => d.id == value as String)?.id ?? "Figure"
        }
        spec.filterParams[k] = {$set: value}
      }
    }

    dispatch({type: "update-state", spec})
  }, [])


  const {filterParams, searchBackend} = value
  const {query, type, search_logic} = filterParams

  useEffect(()=>{
    updateSearchString({query, type, search_logic, backend: searchBackend})
  }, [filterParams, searchBackend])

  return h(AppStateContext.Provider, {value},
    h(FeatureClassContext.Provider, {value: types},
      h(AppDispatchContext.Provider, {value: dispatch}, props.children)
    )
  )
}

const useAppState = ()=>useContext(AppStateContext)
const useAppDispatch = ()=>useContext(AppDispatchContext)
const useTypes = ()=>useContext(FeatureClassContext)

export {ThresholdKey, SearchBackend, ESSearchLogic} from './reducer'
export {
  AppStateProvider,
  useAppState,
  useAppDispatch,
  useTypes
}
