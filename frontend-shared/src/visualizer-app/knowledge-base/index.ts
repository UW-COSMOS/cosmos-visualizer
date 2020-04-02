import h from '@macrostrat/hyper';
import {InfiniteScrollView} from "@macrostrat/ui-components";
import {Spinner} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {SearchInterface} from './search-interface'
import {AppStateProvider, useAppState, SearchBackend} from './provider'
import {Placeholder} from './placeholder'
import './main.styl';
import {Footer} from '../landing-page'

const LoadingPlaceholder = ()=>{
  return h(Placeholder, {
      icon: h(Spinner),
      title: "Loading extractions",
      description: ""
  })
}

type ResProps = {data: APIDocumentResult[]}
const DocumentResults = (props: ResProps)=>{
  const data = props.data ?? []
  const isLoading = true
  if (data.length == 0 && isLoading) return h(LoadingPlaceholder)
  if (data.length == 0) return h(Placeholder, {
      icon: 'inbox',
      title: "No results",
      description: "No matching extractions found"
  });

  return h('div.documents', data.map((d, i) => {
    return h(DocumentExtraction, {data: d, index: i})
  }));
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
      switch (searchBackend) {
        case SearchBackend.ElasticSearch:
          return res.results
        case SearchBackend.Anserini:
          return res.objects
      }
    },
    hasMore(state, res) {
      return true
    },
    // Currently only shows for ongoing pages...
    placeholder: h(LoadingPlaceholder)
  }, (data)=>h(DocumentResults, {data}))
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
