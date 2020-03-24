import h from '@macrostrat/hyper';
import classNames from 'classnames';
import {Button} from '@blueprintjs/core';
import {Omnibar} from '@blueprintjs/select';
import {useTags, useAnnotationEditor} from '~/providers'
import Fuse from 'fuse.js';
import chroma from 'chroma-js';

interface TagItemProps {
  active: boolean,
  className?: string,
  tag: Tag,
  onSelect(t: Tag): void,
  children?: React.ReactElement
}

const TagListItem = (props: TagItemProps)=>{
  /** Render a tag for the omnibox list */
  let {active, className, onSelect, tag, children} = props;
  className = classNames({active}, className);
  const color = chroma(tag.color);
  const light = color.set('hsl.l', active ? 0.5 : 0.95);
  const dark = color.set('hsl.l', active ? 0.95 : 0.5);

  const onClick = ()=> onSelect(tag)

  return h('div.tag-item-container', {
    key: tag.tag_id,
    className, onClick,
    style: {backgroundColor: light.css(), color: dark.css()}
  }, [
    h('div.tag-item', {}, tag.name),
    children
  ]);
}

interface OmniboxProps {
  selectedTag: Tag,
  onSelectTag: (t: Tag)=>void,
  listItemComponent: React.ComponentType<TagItemProps>
  isOpen: boolean
}

const AnnotationTypeOmnibox = (props: OmniboxProps)=>{
  /** A general omnibox for annotation types */
  const {selectedTag, onSelectTag, listItemComponent, isOpen} = props
  const tags = useTags()
  const options = {
    shouldSort: true,
    minMatchCharLength: 0,
    keys: ["name", "description"]
  };

  let fuse = null

  const itemListRenderer = (obj)=>{
    const {filteredItems} = obj;
    return h('div.item-list', null, filteredItems.map((tag: Tag)=> {
      const active = tag.tag_id === selectedTag.tag_id;
      const onSelect = () => onSelectTag(tag);
      return h(listItemComponent, {
        active,
        onSelect,
        tag
      });
    }));
  }

  return h(Omnibar, {
    onItemSelect: onSelectTag,
    items: tags,
    resetOnSelect: true,
    isOpen,
    itemRenderer: undefined,
    itemListRenderer,
    itemListPredicate(query, items) {
      if (query === "") { return items; }
      if ((fuse == null)) {
        fuse = new Fuse(items, options);
      }
      return fuse.search(query);
    }
  });
}

AnnotationTypeOmnibox.defaultProps = {
  listItemComponent: TagListItem
}

interface LockableItemProps extends TagItemProps {
  toggleLock(v: Tag): void,
  locked: boolean
}

const LockableListItem = (props: LockableItemProps)=>{
  let {tag, ...rest} = props;

  const ctx = useAnnotationEditor()!
  const {lockedTags} = ctx
  const {toggleTagLock} = ctx.actions!
  const toggleLock = toggleTagLock(tag.tag_id)
  const locked = lockedTags.has(tag.tag_id);

  const icon = locked ? 'lock' : 'unlock';

  return h(TagListItem, {tag, ...rest}, h(Button, {
    minimal: true,
    icon,
    small: true,
    onClick(event: React.MouseEvent){
      toggleLock()
      event.stopPropagation()
    }})
  );
}

LockableListItem.defaultProps = {locked: false}

const AnnotationTypeSelector = (props)=>{
  /** A lockable annotation type selector (first output, for tagging app) */
  const {onItemSelect, ...rest} = props;

  return h(AnnotationTypeOmnibox, {
    ...rest,
    onItemSelect,
    listItemComponent: LockableListItem
  });
}

export {AnnotationTypeSelector, AnnotationTypeOmnibox};
