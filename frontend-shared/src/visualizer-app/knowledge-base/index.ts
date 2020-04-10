import h from '@macrostrat/hyper';
import {
  InfiniteScrollView,
  APIResultProps,
  DarkModeButton,
  useAPIView,
  useAPIResult
} from "@macrostrat/ui-components";
import {Spinner} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {SearchInterface} from './search-interface'
import {AppStateProvider, useAppState, SearchBackend} from './provider'
import {Placeholder} from './placeholder'
import {Footer} from '../landing-page'
import {format} from 'd3-format'
import queryString from 'query-string'
import './main.styl';

const fmt = format(',.0f')

// TODO: Trial queries should be provided by the API
const trialQueries = [
  "incidence rate",
  "ACE2",
  "coronavirus lungs",
  "opacity",
  "peak infections",
  "death rate",
]

const TrialQueries = (props)=>{
  return h("ul.trial-queries", trialQueries.map((d,i)=>{
    const qstr = queryString.stringify({query: d})
    return h("li", {key: i}, h('a', {href: "?"+qstr}, d))
  }))
}

const PlaceholderDescription = ()=>{
  const res = useAPIResult("/statistics")
  const description = h([
    h("p","Enter a query to search. Or try one of these examples:"),
    h(TrialQueries)
  ])
  if (res == null) {
    return h("div.description", [
      h('div.desc-spinner', null, h(Spinner, {size: 20})),
      description
    ])
  }
  return h("div.description", [
    h("p", [
      "The ",
      // TODO: Make sure we add this to the "statistics" API.
      h("b", "novel coronavirus"),
      ` knowledge base consists of ${fmt(res.n_objects)}
        entities extracted from ${fmt(res.n_pdfs)} scientific publications.`]
    ),
    description
  ])
}

const StartingPlaceholder = (props)=>{
  return h(Placeholder, {
    icon: 'search-template',
    title: "COSMOS visualizer",
    description: h(PlaceholderDescription)
  })
}

const LoadingPlaceholder = (props: {perPage: number})=>{
  const {perPage} = props
  const ctx = useAPIView()
  const page = ctx.params?.page ?? 0

  let computedPageCount = null
  if (perPage != null && ctx.totalCount != null) {
    computedPageCount = Math.ceil(ctx.totalCount/perPage)
  }
  const pageCount = ctx.pageCount ?? computedPageCount

  let desc = null
  if (page >= 1) {
    desc = `Page ${page+1}`
    if (pageCount != null) desc += ` of ${pageCount}`
  }

  return h(Placeholder, {
      icon: h(Spinner),
      title: "Loading extractions",
      description: desc
  })
}

LoadingPlaceholder.defaultProps = {perPage: 10}

type ResProps = APIResultProps<APIDocumentResult[]>

const DocumentResults = (props: ResProps)=>{
  const data = props.data ?? []
  const {isLoading} = props
  if (data.length == 0 && !isLoading) return h(Placeholder, {
      icon: 'inbox',
      title: "No results",
      description: "No matching extractions found"
  });

  const offset = 0

  return h([
    h('div.documents', data.map((d, i) => {
      return h(DocumentExtraction, {key: i, data: d, index: i})
    })),
    h.if(isLoading)(LoadingPlaceholder)
  ]);
}

const ResultsView = (props)=>{
  const {filterParams, searchBackend} = useAppState()

  const {query} = filterParams
  const queryNotSet = query == null || query == ''

  let route = searchBackend == SearchBackend.Anserini ? '/search' : '/search_es_objects'

  // Get query count as separate transaction for Anserini backend
  const countRoute = searchBackend == SearchBackend.Anserini && !queryNotSet ? "/count" : null
  const res = useAPIResult(countRoute, filterParams)
  const count = res?.total_results

  if (queryNotSet) {
    return h("div.results", null, h(StartingPlaceholder))
  }

  return h(InfiniteScrollView, {
    className: 'results',
    route,
    opts: {
      unwrapResponse(res){ return res; }
    },
    params: filterParams,
    totalCount: count,
    getCount(res) {
      return res.total_results
    },
    getNextParams(res, params) {
      return {...params, page: (params.page ?? 0) + 1}
    },
    getItems(res){
      return res.objects
    },
    hasMore(res) {
      return res.objects.length > 0
    }
  }, h(DocumentResults))
}

const KnowledgeBaseFilterView = (props)=>{
  const {types} = props;
  return h(AppStateProvider, {types},
    h('div#knowledge-base-filter.main', [
      h("div.corner-controls", [
        h(DarkModeButton, {minimal: true})
      ]),
      h(SearchInterface),
      h(ResultsView),
      h(Footer)
    ])
  );
}

KnowledgeBaseFilterView.defaultProps = {
  types: [
    {id: 'Figure', name: 'Figure'},
    {id: 'Table', name: 'Table'},
    {id: 'Equation', name: 'Equation'},
    {id: 'Body Text', name: 'Body Text'}
  ]
}

export {KnowledgeBaseFilterView};
