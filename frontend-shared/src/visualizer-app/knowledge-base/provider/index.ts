import {createContext, useEffect, useReducer, useContext} from 'react'
import h from '@macrostrat/hyper'
import {appReducer, AppAction, AppState, SearchBackend} from './reducer'
import {useSearchString} from "./query-string"

const initialState: AppState = {
  filterParams: {
    query: "",
    base_confidence: 0.8,
    postprocessing_confidence: 0.8,
    area: 50000
  },
  searchBackend: SearchBackend.Anserini
}

const AppStateContext = createContext<AppState>(initialState)
const AppDispatchContext = createContext<AppReducer>(appReducer)

const AppStateProvider = (props: {children: React.ReactChild})=>{

  const [value, dispatch] = useReducer(appReducer, initialState)
  const {filterParams} = value

  const [searchString, updateSearchString] = useSearchString()
  useEffect(()=>{
    let {query} = searchString
    if (query == null) return
    if (Array.isArray(query)) query = query.join(" ")
    dispatch({type: "update-query", query})
  }, [])

  useEffect(()=>{
    const {query} = filterParams
    if (query == null || query == "" || query == searchString.query) return
    updateSearchString({query})
  }, [filterParams.query])

  return h(AppStateContext.Provider, {value},
    h(AppDispatchContext.Provider, {value: dispatch}, props.children)
  )
}

const useAppState = ()=>useContext(AppStateContext)
const useAppDispatch = ()=>useContext(AppDispatchContext)

export {AppStateProvider, useAppState, useAppDispatch, SearchBackend}
