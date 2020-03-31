import h from '@macrostrat/hyper';
import {APIResultView, InfiniteScrollView} from "@macrostrat/ui-components";
import {NonIdealState} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {RelatedTerms} from './related-terms'
import {SearchInterface} from './search-interface'
import {AppStateProvider, useAppState, SearchBackend} from './provider'
import {InlineNavbar} from '~/util';
import './main.styl';

const PlaceholderView = ()=>{
  return h(NonIdealState, {
    icon: 'search-template',
    title: "No results yet",
    description: "Enter a query to search the knowledge base"
  });
}

type ResProps = {data: APIDocumentResult[]}
const DocumentResults = (props: ResProps)=>{
  const data = props.data ?? []
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

  const {filterParams, searchBackend} = useAppState()

  const {query} = filterParams
  if (query == null || query == '') return h(PlaceholderView)

  let route = searchBackend == SearchBackend.Anserini ? '/search' : '/search_es_objects'

  return h("div.results", [
    h(InfiniteScrollView, {
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
      }
    }, (data)=>h(DocumentResults, {data}))
  ])
}

const KnowledgeBaseFilterView = (props)=>{
  const {types} = props;

  return h(AppStateProvider, {types},
    h('div#knowledge-base-filter.main', [
      h(SearchInterface),
      h(RelatedTerms),
      h(ResultsView)
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
