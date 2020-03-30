import h from '@macrostrat/hyper';
import {APIResultView} from "@macrostrat/ui-components";
import {NonIdealState} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {RelatedTerms} from './related-terms'
import {Searchbar} from './search-interface'
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
    h(RelatedTerms, {query}),
    h(APIResultView, {
      route,
      opts: {
        unwrapResponse(res){ return res; }
      },
      debounce: 500,
      params: filterParams,
      topPagination: true,
      bottomPagination: false
    }, (data)=>h(DocumentResults, {data: data.objects}))
  ])
}

const KnowledgeBaseFilterView = (props)=>{
  const {types} = props;

  return h(AppStateProvider, {types},
    h('div#knowledge-base-filter.main', [
      h(InlineNavbar, {subtitle: 'Knowledge base filter'}),
      h(Searchbar),
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
