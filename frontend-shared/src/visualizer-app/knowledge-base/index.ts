/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';
import {StatefulComponent, APIContext,
        PagedAPIView, APIResultView} from '@macrostrat/ui-components';
import {InputGroup, Popover, Button, Menu, Position} from '@blueprintjs/core';
import {ModelExtraction} from './model-extraction';
import {debounce} from 'underscore';

import {InlineNavbar} from '~/util';
import './main.styl';

class KnowledgeBaseFilterView extends StatefulComponent {
  static contextType = APIContext;
  constructor(props){
    super(props);
    this.renderExtractions = this.renderExtractions.bind(this);
    this.updateQuery = this.updateQuery.bind(this);

    this.state = {
      doc_ids: [],
      types: [],
      opts: {
        unwrapResponse(res){ return res.success.data[0]; }
      },
      filterParams: {
        query: "sars"
      }
    };
  }

  renderExtractions(data){
    const {query} = this.state.filterParams;
    return h('div.results', data.map((d, i) => h(ModelExtraction, {...d, index: i, query})));
  }

  render() {
    const {filterParams} = this.state;
    return h('div#knowledge-base-filter.main', [
      h(InlineNavbar, {subtitle: 'Knowledge base filter'}),
      this.renderSearchbar(),
      h(PagedAPIView, {
        route: '',
        opts: {
          unwrapResponse(res){ return res.results; }
        },
        params: filterParams,
        topPagination: true,
        bottomPagination: false
      }, this.renderExtractions)
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
