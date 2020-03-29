import h from '@macrostrat/hyper';
import {useState} from 'react';
import {
  InputGroup,
  Popover,
  Button,
  ButtonGroup,
  Menu,
  Position,
  Collapse,
  Slider,
  Card
} from '@blueprintjs/core';
import {debounce} from 'underscore';

interface SearchInterfaceProps {
  filterParams: object,
  types: object,
  updateFilter: any
}

const FilterPanel = (props)=> {
  const {isOpen} = props
  return h(Collapse, {isOpen}, [
    h(Card, [
      h(ButtonGroup, [
        h(Button, {disabled: true}, "Anserini"),
        h(Button, "ElasticSearch")
      ]),
      h(Slider)
    ])
  ])
}

const Searchbar = (props: SearchInterfaceProps)=>{
  const {types, filterParams, updateFilter} = props;

  const [filterPanelOpen, setFilterPanelOpen] = useState<boolean>(true)

  const menuItems = types.map(d=> {
    const onClick = () => {
      return updateFilter({type: {$set: d.id}});
    };
    return h(Menu.Item, {onClick, text: d.name});
});

  const onClick = () => {
    const {type, ...val} = filterParams;
    return updateFilter({$set: val});
  };
  menuItems.push(h(Menu.Divider));
  menuItems.push(h(Menu.Item, {onClick, text: "All types"}));

  const content = h(Menu, menuItems);
  const position = Position.BOTTOM_RIGHT;

  const type = filterParams.type || "All types";
  const rightElement = h(Popover, {content, position}, [
    h(Button, {minimal: true, rightIcon: "filter"}, type)
  ]);

  const __updateQuery = (value)=> updateFilter({query: {$set: value}})

  const updateQuery = debounce(__updateQuery, 500);
  const onChange = event => updateQuery(event.target.value);

  return h('div.search-interface', [
    h(InputGroup, {
      className: 'main-search',
      large: true,
      leftIcon: 'search',
      placeholder: "Search extractions",
      onChange,
      rightElement
    }),
    h(FilterPanel, {isOpen: filterPanelOpen || (filterParams.query?.length ?? 0) > 0})
  ]);
}

export {Searchbar}
