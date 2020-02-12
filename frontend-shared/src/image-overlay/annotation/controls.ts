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
import {Button, Intent} from '@blueprintjs/core';
import classNames from 'classnames';

import {Rectangle, StaticRectangle} from './drag-rect';
import {EditMode} from '~/enum';
import {EditorContext} from '~/image-overlay/context';
import {
  useCanvasSize,
  useTags,
  useAnnotationColor,
  useAnnotationUpdater,
  useAnnotationActions,
  useAnnotationIndex,
  useSelectedAnnotation,
  useSelectionUpdater,
  Annotation as IAnnotation
} from '~/providers'

const ToolButton = props => h(Button, {small: true, minimal: true, ...props});

const tagBounds = boxes => [
  min(boxes, d => d[0]),
  min(boxes, d => d[1]),
  max(boxes, d => d[2]),
  max(boxes, d => d[3])
];

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

interface AnnotationControlProps {
  annotation: IAnnotation
}

const ControlPanel = (props: AnnotationControlsProps)=>{

  const {children, annotation} = props
  const {boxes} = annotation;

  // Calculate editing menu position
  const {height, scaleFactor} = useCanvasSize()
  const maxY = boxes[0][3]/scaleFactor
  const className = maxY > height-50 ? 'top' : 'bottom'


  // Make sure clicks on the control panel don't dismiss it
  // due to the competing overlay click handler
  const onClick = event => event.stopPropagation();
  const style = {pointerEvents: 'visible'}

  return h('div.rect-controls', {className, onClick, style}, children);
}

const AnnotationControls = (props: AnnotationControlsProps)=>{
  const {
    onSelect,
    annotation
  } = props;

  const update = useAnnotationUpdater(annotation)!
  if (update == null) return null

  const {deleteAnnotation} = useAnnotationActions()!
  const ix = useAnnotationIndex(annotation)
  const {linked_to} = annotation;

  const {actions: {setMode}, editModes} = useContext(EditorContext);

  return h(ControlPanel, {annotation}, [
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
      onClick: ()=>deleteAnnotation(ix)
    })
  ]);
}


import {AnnotationApproverContext} from "~/providers/annotation-approver"

const ApprovalControls = (props)=>{
  const {annotation} = props
  const ctx = useContext(AnnotationApproverContext)
  if (ctx == null) return null
  const {actions, isAnnotationApproved} = ctx

  const ix = useAnnotationIndex(props.annotation)

  const isApproved = isAnnotationApproved[ix]
  const isSet = isApproved != null

  return h(ControlPanel, {annotation}, [
    h(ToolButton, {
      icon: 'thumbs-up',
      intent: isSet && isApproved ? 'success' : null,
      onClick: ()=>actions.toggleThumbsUp(annotation, true)
    }),
    h(ToolButton, {
      icon: 'thumbs-down',
      intent: isSet && !isApproved ? 'danger' : null,
      onClick: ()=>actions.toggleThumbsUp(annotation, false)
    })
  ])
}

export {AnnotationControls, ApprovalControls};
