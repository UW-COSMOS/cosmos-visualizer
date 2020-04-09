import h from '@macrostrat/hyper';
import {InfiniteScrollView, APIResultProps, useAPIView} from "@macrostrat/ui-components";
import {Spinner} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {SearchInterface} from './search-interface'
import {AppStateProvider, useAppState, SearchBackend} from './provider'
import {Placeholder} from './placeholder'
import './main.styl';
import {Footer} from '../landing-page'

const LoadingPlaceholder = (props: {perPage: number})=>{
  const {perPage} = props
  const ctx = useAPIView()
  const page = ctx.params?.page ?? 1
  console.log(ctx)


  let computedPageCount = null
  if (perPage != null && ctx.totalCount != null) {
    computedPageCount = Math.ceil(ctx.totalCount/perPage)
  }
  const pageCount = ctx.pageCount ?? computedPageCount

  let title = "Loading extractions"
  if (page > 1) {
    title = `Loading page ${page}`
  }
  if (pageCount != null) title += ` of ${pageCount}`


  return h(Placeholder, {
      icon: h(Spinner),
      title,
      description: ""
  })
}

LoadingPlaceholder.defaultProps = {perPage: 10}

type ResProps = APIResultProps<APIDocumentResult[]>

const DocumentResults = (props: ResProps)=>{
  const data = props.data ?? []
  const {isLoading} = props
  if (data.length == 0 && isLoading) return h(LoadingPlaceholder)
  if (data.length == 0) return h(Placeholder, {
      icon: 'inbox',
      title: "No results",
      description: "No matching extractions found"
  });

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
  if (query == null || query == '') return h("div.results", null, h(Placeholder))

  let route = searchBackend == SearchBackend.Anserini ? '/search' : '/search_es_objects'

  return h(InfiniteScrollView, {
    className: 'results',
    route,
    opts: {
      unwrapResponse(res){ return res; }
    },
    params: filterParams,
    getCount(res) {
      return res.total_results
    },
    getNextParams(res, params) {
      return {...params, page: (params.page ?? 0) + 1}
    },
    getItems(res){
      return res.objects
    },
    hasMore(state, res) {
      return res.objects.length > 0
    }
  }, h(DocumentResults))
}

const KnowledgeBaseFilterView = (props)=>{
  const {types} = props;

  return h(AppStateProvider, {types},
    h('div#knowledge-base-filter.main', [
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
