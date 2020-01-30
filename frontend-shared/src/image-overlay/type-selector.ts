/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from 'react';
import h from 'react-hyperscript';
import classNames from 'classnames';
import styled from '@emotion/styled';
import {Button} from '@blueprintjs/core';
import {Omnibar} from '@blueprintjs/select';
import {useTags} from '~/providers'
import Fuse from 'fuse.js';
import chroma from 'chroma-js';

class ListItem extends Component {
  constructor(...args) {
    super(...args);
    this.toggleLock = this.toggleLock.bind(this);
  }

  toggleLock(event){
    const {toggleLock} = this.props;
    toggleLock();
    return event.stopPropagation();
  }
  render() {
    let {active, className, onClick, locked, ...d} = this.props;
    if (locked == null) { locked = false; }
    className = classNames({active}, className);
    const color = chroma(d.color);
    const l = active ? 0.5 : 0.95;
    const light = color.set('hsl.l', l);
    const _ = active ? 0.95 : 0.5;
    const dark = color.set('hsl.l', _);
    const icon = locked ? 'lock' : 'unlock';

    return h('div.tag-item-container', {
      key: d.id,
      className, onClick,
      style: {backgroundColor: light.css(), color: dark.css()}
    }, [
      h('div.tag-item', {}, d.name),
      h(Button, {minimal: true, icon, small: true, onClick: this.toggleLock})
    ]);
  }
}

const TypeSelector = (props)=>{
  const options = {
    shouldSort: true,
    minMatchCharLength: 0,
    keys: ["name", "description"]
  };
  let fuse = null;
  const tags = useTags()
  const {lockedTags, toggleLock, onItemSelect, currentTag, ...rest} = props;

  return h(Omnibar, {
    ...rest,
    onItemSelect,
    items: tags,
    resetOnSelect: true,
    itemListRenderer: obj=> {
      const {filteredItems, activeItem} = obj;
      return h('div.item-list', null, filteredItems.map(d=> {
        const active = d.tag_id === currentTag;
        const locked = lockedTags.has(d.tag_id);
        const onClick = () => {
          return onItemSelect(d);
        };
        return h(ListItem, {
          active,
          onClick,
          toggleLock: toggleLock(d.tag_id),
          locked, ...d});
    }));
    },
    itemListPredicate(query, items){
      if (query === "") { return items; }
      if ((fuse == null)) {
        fuse = new Fuse(items, options);
      }
      return fuse.search(query);
    }
  });
}

export {TypeSelector};
