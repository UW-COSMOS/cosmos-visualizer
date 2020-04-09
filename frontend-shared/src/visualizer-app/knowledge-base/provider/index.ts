import {createContext, useEffect, useReducer, useContext} from 'react'
import h from '@macrostrat/hyper'
import {appReducer, AppDispatch, SearchBackend} from './reducer'
import {useSearchString} from "./query-string"
import {Spec} from 'immutability-helper'

const initialState: AppState = {
  filterParams: {
    query: "",
    postprocessing_confidence: 0.72,
    base_confidence: 0.72,
    //postprocessing_confidence: 0.8,
    //area: 50000,
    type: "Figure"
  },
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
    let {query, backend} = searchString
    if (query == null) return

    // These are basically hacks for weirdness in the query-string library
    if (Array.isArray(backend)) backend = backend.join(" ")
    if (Array.isArray(query)) query = query.join(" ")

    const type = types.find(d => d.id == searchString.type)?.id ?? "Figure" // Hack
    let spec: Spec<AppState> = {filterParams: {$set: {query, type}}}

    const searchBackend = searchBackendForString(backend)
    if (searchBackend != null) {
      // We have a valid search backend
      spec.searchBackend = {$set: searchBackend}
    }

    dispatch({type: "update-state", spec})
  }, [])


  const {filterParams, searchBackend} = value
  const {query, type} = filterParams

  useEffect(()=>{
    updateSearchString({query, type, backend: searchBackend})
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

export {ThresholdKey, SearchBackend} from './reducer'
export {
  AppStateProvider,
  useAppState,
  useAppDispatch,
  useTypes
}
