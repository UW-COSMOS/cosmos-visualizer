import h from '@macrostrat/hyper';
import {InputGroup, Popover, Button, Menu, Position} from '@blueprintjs/core';
import {debounce} from 'underscore';

interface SearchInterfaceProps {
  filterParams: object,
  types: object,
  updateFilter: any
}

const Searchbar = (props: SearchInterfaceProps)=>{
  const {types, filterParams, updateFilter} = props;

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

  return h(InputGroup, {
    className: 'main-search',
    large: true,
    leftIcon: 'search',
    placeholder: "Search extractions",
    onChange,
    rightElement
  });
}

export {Searchbar}
