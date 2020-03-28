import h from 'react-hyperscript';
import {StatefulComponent, APIContext,
        PagedAPIView, APIResultView} from "@macrostrat/ui-components";
import {InputGroup, Popover, Button, Menu, Position, NonIdealState} from '@blueprintjs/core';
import {DocumentExtraction} from './model-extraction';
import {debounce} from 'underscore';
import {RelatedTerms} from './related-terms'

import {InlineNavbar} from '~/util';
import './main.styl';

const PlaceholderView = ()=>{
  return h(NonIdealState, {
    icon: 'search-template',
    title: "No results yet",
    description: "Enter a query to search the knowledge base"
  });
}

const DocumentResults = (props: {data: APIDocumentResult[]})=>{
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

  const renderExtractions = (data: APIDocumentResult[])=>{
    console.log(query)
    return h('div.results', data.map((d, i) => {
      return h(DocumentExtraction, {data: d, index: i, query})
    }));
  }

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
    }, renderExtractions)
  ])
}

class KnowledgeBaseFilterView extends StatefulComponent {
  static contextType = APIContext;
  constructor(props){
    super(props);
    this.updateQuery = this.updateQuery.bind(this);

    this.state = {
      doc_ids: [],
      types: [],
      opts: {
        unwrapResponse(res){ return res.success.data[0]; }
      },
      filterParams: {
        query: ""
      }
    };
  }

  render() {
    const {filterParams} = this.state;
    return h('div#knowledge-base-filter.main', [
      h(InlineNavbar, {subtitle: 'Knowledge base filter'}),
      this.renderSearchbar(),
      h(ResultsView, {filterParams})
    ]);
  }

  updateQuery(value){
    return this.updateState({filterParams: {query: {$set: value}}});
  }

  renderSearchbar() {
    const {types} = this.state;

    const menuItems = types.map(d=> {
      const onClick = () => {
        return this.updateState({filterParams: {type: {$set: d.id}}});
      };
      return h(Menu.Item, {onClick, text: d.name});
  });

    const onClick = () => {
      const {type, ...val} = this.state.filterParams;
      return this.updateState({filterParams: {$set: val}});
    };
    menuItems.push(h(Menu.Divider));
    menuItems.push(h(Menu.Item, {onClick, text: "All types"}));

    const content = h(Menu, menuItems);
    const position = Position.BOTTOM_RIGHT;

    const type = this.state.filterParams.type || "All types";
    const rightElement = h(Popover, {content, position}, [
      h(Button, {minimal: true, rightIcon: "filter"}, type)
    ]);

    const updateQuery = debounce(this.updateQuery,500);
    const onChange = event => updateQuery(event.target.value);

    return h(InputGroup, {
      className: 'main-search',
      large: true,
      leftIcon: 'search',
      placeholder: "Search extractions",
      onChange,
      rightElement
    });
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
