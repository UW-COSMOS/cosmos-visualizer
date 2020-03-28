import h from '@macrostrat/hyper';
import {StatefulComponent, APIContext, APIResultView} from "@macrostrat/ui-components";
import {NonIdealState} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {RelatedTerms} from './related-terms'
import {Searchbar} from './search-interface'

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

class KnowledgeBaseFilterView extends StatefulComponent<{},{}> {
  static contextType = APIContext;
  state = {
    doc_ids: [],
    types: [],
    opts: {
      unwrapResponse(res){ return res.success.data[0]; }
    },
    filterParams: {
      query: ""
    }
  };

  render() {
    const {filterParams, types} = this.state;

    const updateFilter = (spec)=>this.updateState({filterParams: spec})

    return h('div#knowledge-base-filter.main', [
      h(InlineNavbar, {subtitle: 'Knowledge base filter'}),
      h(Searchbar, {filterParams, updateFilter, types}),
      h(ResultsView, {filterParams})
    ]);
  }

  getTypes() {
    const types = [
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
    ];
    return this.setState({types});
  }

  componentDidMount() {
    return this.getTypes();
  }
}

export {KnowledgeBaseFilterView};
