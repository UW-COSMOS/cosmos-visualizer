import h from '@macrostrat/hyper';
import {APIResultView} from "@macrostrat/ui-components";
import {NonIdealState} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {RelatedTerms} from './related-terms'
import {Searchbar} from './search-interface'
import {useEffect, useReducer} from "react"
import {useSearchString} from "./query-string"
import update, {Spec} from 'immutability-helper'
import {InlineNavbar} from '~/util';
import './main.styl';

type FilterParams = {
  query: string,
  baseConfidence: number,
  postprocessingConfidence: number,
  area: number
}

interface AppState {
  filterParams: FilterParams,
  searchBackend: SearchBackend
}

enum SearchBackend {
  ElasticSearch = 'elastic-search',
  Anserini = 'anserini'
}

const initialState: AppState = {
  filterParams: {
    query: "",
    baseConfidence: 0.8,
    postprocessingConfidence: 0.8,
    area: 50000
  },
  searchBackend: SearchBackend.Anserini
}

type UpdateQuery = {type: "update-query", query: string}
type UpdateFilter = {type: "update-filter", spec: Spec<FilterParams>}

type AppAction =
  | UpdateQuery
  | UpdateFilter

type AppReducer = (a: AppState, action: AppAction)=> AppState

const appReducer: AppReducer = (state, action)=>{
  switch (action.type) {
    case 'update-query':
      const {query} = action
      return appReducer(state, {type: 'update-filter', spec: {query: {$set: query}}})
      ///let state = appReducer(state, {type: 'change-query-string'})
    case 'update-filter':
      return update(state, {filterParams: action.spec})
  }
}

const PlaceholderView = ()=>{
  return h(NonIdealState, {
    icon: 'search-template',
    title: "No results yet",
    description: "Enter a query to search the knowledge base"
  });
}

type ResProps = {data: APIDocumentResult[]}
const DocumentResults = (props: ResProps)=>{
  const {data} = props
  if (data.length == 0) return h(NonIdealState, {
      icon: 'inbox',
      title: "No results",
      description: "No matching extractions found"
  });

  return h('div.results', data.map((d, i) => {
    return h(DocumentExtraction, {data: d, index: i})
  }));
}

const ResultsView = (props)=>{
  const {filterParams} = props
  const {query} = filterParams
  if (query == null || query == '') return h(PlaceholderView)

  return h("div.results", [
    h(RelatedTerms, {query}),
    h(APIResultView, {
      route: '',
      opts: {
        unwrapResponse(res){ return res.results; }
      },
      params: filterParams,
      topPagination: true,
      bottomPagination: false
    }, (data)=>h(DocumentResults, {data}))
  ])
}

const KnowledgeBaseFilterView = (props)=>{
  const {types} = props;

  const [state, dispatch] = useReducer(appReducer, initialState)
  const {filterParams} = state

  const [searchString, updateSearchString] = useSearchString()
  useEffect(()=>{
    let query = searchString.q
    if (query == null) return
    if (Array.isArray(query)) query = query.join(" ")
    dispatch({type: "update-query", query})
  }, [])

  useEffect(()=>{
    const {query} = filterParams
    if (query == null || query == "" || query == searchString.q) return
    updateSearchString({q: query})
  }, [filterParams.query])

  const updateFilter = (spec: Spec<FilterParams>)=>{
    dispatch({type: 'update-filter', spec})
  }

  return h('div#knowledge-base-filter.main', [
    h(InlineNavbar, {subtitle: 'Knowledge base filter'}),
    h(Searchbar, {filterParams, updateFilter, types}),
    h(ResultsView, {filterParams})
  ]);
}

KnowledgeBaseFilterView.defaultProps = {
  types: [
    {id: 'Figure', name: 'Figure'},
    {id: 'Figure Caption', name: 'Figure Caption'},
    {id: 'Table', name: 'Table'},
    {id: 'Table Caption', name: 'Table Caption'},
    {id: 'Equation', name: 'Equation'},
    {id: 'Code', name: 'Code'},
    {id: 'Body Text', name: 'Body Text'},
    {id: 'Reference text', name: 'Reference text'},
    {id: 'Other', name: 'Other'},
    {id: 'Page Header', name: 'Page Header'},
    {id: 'Page Footer', name: 'Page Footer'},
    {id: 'Section Header', name: 'Section Header'}
  ]
}

const testState = {
  doc_ids: [],
  types: [],
  opts: {
    unwrapResponse(res){ return res.success.data[0]; }
  },
  filterParams: {
    query: ""
  }
};

export {KnowledgeBaseFilterView};
