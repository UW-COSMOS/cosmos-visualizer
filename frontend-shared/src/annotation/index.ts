/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {useContext} from 'react';
import h from '@macrostrat/hyper';
import {min, max} from 'd3-array';
import {Rectangle} from './drag-rect';
import {Button, Intent} from '@blueprintjs/core';
import classNames from 'classnames';
import {EditMode} from '../enum';
import {EditorContext} from '../image-overlay/context';
import {useCanvasSize, useTags, useTagColor} from '~/providers'

const ToolButton = props => h(Button, {small: true, minimal: true, ...props});

const tagBounds = boxes => [
  min(boxes, d => d[0]),
  min(boxes, d => d[1]),
  max(boxes, d => d[2]),
  max(boxes, d => d[3])
];

const tagCenter = function(boxes){
  const d = tagBounds(boxes);
  return [(d[0]+d[2])/2, (d[1]+d[3])/2];
};

const LinkButton = (props)=>{
  const {update} = props;
  const {actions: {setMode}, editModes} = useContext(EditorContext);
  const removeLink = () => update({linked_to: {$set: null}});

  if (props.linked_to != null) {
    return h(ToolButton, {
      icon: 'ungroup-objects',
      onClick: removeLink
    });
  }
  return h(ToolButton, {
    icon: 'new-link',
    intent: editModes.has(EditMode.LINK) ? Intent.SUCCESS : undefined,
    onClick() { return setMode(EditMode.LINK); }
  });
}

const AnnotationControls = (props)=>{
  const {
    delete: deleteRectangle,
    onSelect,
    update,
    boxes,
    linked_to
  } = props;

  if (update == null) { return null; }

  // Calculate editing menu position
  const {height, scaleFactor} = useCanvasSize()
  const maxY = boxes[0][3]/scaleFactor
  const className = maxY > height-50 ? 'top' : 'bottom'

  const {actions: {setMode}, editModes} = useContext(EditorContext);

  // Make sure clicks on the control panel don't dismiss it
  // due to the competing overlay click handler
  const onClick = event => event.stopPropagation();

  const style = {pointerEvents: 'visible'}

  return h('div.rect-controls', {className, onClick, style}, [
    h(ToolButton, {
      icon: 'tag',
      onClick: onSelect
    }),
    h(LinkButton, {update, linked_to}),
    h(ToolButton, {
      icon: 'insert',
      intent: editModes.has(EditMode.ADD_PART) ? Intent.SUCCESS : undefined,
      onClick() { return setMode(EditMode.ADD_PART); }
    }),
    h(ToolButton, {
      icon: 'cross',
      intent: Intent.DANGER,
      onClick: deleteRectangle
    })
  ]);
}

const AnnotationPart = (props)=>{
  const {update, onDelete, bounds, color, ...rest} = props

  return h(Rectangle, {bounds, update, color, ...rest}, [
    h.if(onDelete != null)(ToolButton, {
      icon: 'cross',
      className: 'delete-rect',
      intent: Intent.DANGER,
      onClick: onDelete
    })
  ])
}

function annotationPartUpdater(update, ix){
  /* Returns an updater function for a particular
     annotation subpart
  */
  if (update == null) { return null; }
  // Return an updater function
  return spec=> {
    const {bounds: subSpec} = spec;
    if (subSpec == null) { return; }
    return update({boxes: {[ix]: subSpec}});
  };
}

const Annotation = (props)=>{
  const {boxes, update, name: tag_name, tag_id, ...rest} = props;
  const isSelected = update != null
  const overallBounds = tagBounds(boxes);

  const c = useTagColor(tag_id)
  let alpha = isSelected ? 0.6 : 0.3;

  const color = c.alpha(alpha).css();

  const tags = useTags()
  let tagName = tags.find(d => d.tag_id === tag_id)?.name ?? tag_name;
  // Sometimes we don't return tags

  const className = classNames({active: isSelected});
  return h('div.annotation', {className}, [
    h(Rectangle, {
      bounds: overallBounds,
      color, backgroundColor: 'none',
      style: {pointerEvents: 'none'},
      ...rest
    }, [
      h('div.tag-name', {style: {color: c.darken(2).css()}}, tagName),
      h(AnnotationControls, {update})
    ]),
    h('div.tag', {className}, boxes.map((bounds, i)=> {
      // Need actual logic here to allow display if editing is enabled
      let onDelete = null
      let editingEnabled = false
      if (boxes.length <= 1) editingEnabled = false
      if (editingEnabled) {
        onDelete = () => update({boxes: {$splice: [[i,1]]}})
      }

      return h(AnnotationPart, {
        bounds,
        update: annotationPartUpdater(update, i),
        onDelete,
        color,
        ...rest})
    }))
  ]);
}

// TODO: Not sure where this belongs
// setTag(tag){
//   const {update} = this.props;
//   console.log(tag);
//   return update({tag_id: {$set: tag.tag_id}});
// }

const LockedAnnotation = (props)=>{
  const {boxes, tag_id, ...rest} = props;
  const {scaleFactor, width, height} = useCanvasSize()
  const maxPosition = {width, height}

  const c = useTagColor(tag_id)
  const alpha = 0.2;
  const color = c.alpha(alpha).css();

  return h('div.annotation.locked', boxes.map((bounds, i)=> {
    return h(Rectangle, {
      bounds,
      color,
      scaleFactor,
      maxPosition,
      ...rest
    });
  }));
}

export {Annotation, LockedAnnotation, tagCenter, tagBounds};
