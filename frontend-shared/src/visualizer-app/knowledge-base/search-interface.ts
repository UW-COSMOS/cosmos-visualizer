import h from '@macrostrat/hyper';
import {useState} from 'react';
import {
  InputGroup,
  Button,
  ButtonGroup,
  Menu,
  Position,
  Collapse,
  Slider,
  Card,
  Intent
} from '@blueprintjs/core';
import {useAppState, useAppDispatch, SearchBackend} from './provider'
import {Spec} from 'immutability-helper'

interface SearchInterfaceProps {
  types: object
}

const FilterPanel = (props)=> {
  const {isOpen} = props
  const {searchBackend} = useAppState()
  const dispatch = useAppDispatch()

  const propsFor = (backend: SearchBackend)=>({
    intent: searchBackend == backend ? Intent.PRIMARY : null,
    onClick() {
      if (backend == searchBackend) return
      dispatch({type: 'set-search-backend', backend})
    },
    children: backend,
    small: true
  })

  return h(Collapse, {isOpen}, [
    h(Card, [
      h(ButtonGroup, [
        h(Button, propsFor(SearchBackend.Anserini)),
        h(Button, propsFor(SearchBackend.ElasticSearch))
      ]),
      h(Slider)
    ])
  ])
}

const Searchbar = (props: SearchInterfaceProps)=>{
  const {types} = props;

  const {filterParams} = useAppState()
  const dispatch = useAppDispatch()

  const updateFilter = (spec: Spec<FilterParams>)=>{
    dispatch({type: 'update-filter', spec})
  }

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
  const rightElement = h(Button, {
    minimal: true,
    rightIcon: "filter",
    onClick(){ setFilterPanelOpen(!filterPanelOpen) }
  }, type)

  const updateQuery = (value)=> updateFilter({query: {$set: value}})

  //const updateQuery = debounce(__updateQuery, 500);
  const onChange = event => updateQuery(event.target.value);

  return h('div.search-interface', [
    h(InputGroup, {
      className: 'main-search',
      large: true,
      value: filterParams.query,
      leftIcon: 'search',
      placeholder: "Search extractions",
      onChange,
      rightElement
    }),
    h(FilterPanel, {isOpen: filterPanelOpen})
  ]);
}

export {Searchbar}
