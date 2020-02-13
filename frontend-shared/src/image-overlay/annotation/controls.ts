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

import {EditMode} from '~/enum';
import {EditorContext} from '~/image-overlay/context';
import "./main.styl";
import {
  useCanvasSize,
  useAnnotationUpdater,
  useAnnotationActions,
  useAnnotationIndex,
  Annotation as IAnnotation
} from '~/providers'

const ToolButton = props => h(Button, {small: true, minimal: true, ...props});

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

interface AnnotationControlsProps {
  annotation: IAnnotation,
  className?: string
}

const ControlPanel = (props: AnnotationControlsProps)=>{

  const {children, annotation} = props
  const {boxes} = annotation;

  // Calculate editing menu position
  const {height, scaleFactor} = useCanvasSize()
  const maxY = boxes[0][3]/scaleFactor
  const cls = maxY > height-50 ? 'top' : 'bottom'
  const className = classNames(cls, props.className)


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

interface ThumbProps {
  isApproved: boolean|null,
  update(shouldApprove: boolean): void
}

const ThumbControls = (props: ThumbProps)=>{
  const {isApproved, update, label} = props
  const isSet = isApproved != null

  return h([
    h("div.thumb-controls", [
      h.if(label != null)("span.label", label),
      h("div.buttons", [
        h(ToolButton, {
          icon: 'thumbs-up',
          intent: isSet && isApproved ? 'success' : null,
          onClick() {
            console.log("Clicked thumbs up")
            update(true)
          }
        }),
        h(ToolButton, {
          icon: 'thumbs-down',
          intent: isSet && !isApproved ? 'danger' : null,
          onClick() {
            console.log("Clicked thumbs down")
            update(false)
          }
        })
      ])
    ])
  ])
}


const ApprovalControls = (props)=>{
  const {annotation} = props
  const ctx = useContext(AnnotationApproverContext)
  if (ctx == null) return null
  const {actions, isProposalApproved, isClassificationApproved} = ctx
  const ix = useAnnotationIndex(props.annotation)

  return h(ControlPanel, {annotation, className: 'approval-controls'}, [
    h(ThumbControls, {
      label: "Proposal",
      isApproved: isProposalApproved[ix],
      update(a: boolean) { actions.toggleProposalApproved(annotation, a) }
    }),
    h(ThumbControls, {
      label: "Classification",
      isApproved: isClassificationApproved[ix],
      update(a: boolean) { actions.toggleClassificationApproved(annotation, a) }
    })
  ])
}

export {AnnotationControls, ApprovalControls};
