
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
import {AnnotationApproverContext, useAnnotationApproved} from "../provider"
import {ToolButton, ControlPanel} from '~/image-overlay/annotation/controls'
import "./main.styl";

interface ThumbProps {
  isApproved: boolean|null,
  update(shouldApprove: boolean): void
}

const ThumbControls = (props: ThumbProps)=>{
  const {isApproved, update, label} = props
  const isSet = isApproved != null

  return h("div.thumb-controls", [
    h.if(label != null)("span.label", label),
    h("div.buttons", [
      h(ToolButton, {
        icon: 'thumbs-up',
        intent: isSet && isApproved ? 'success' : null,
        small: true,
        onClick() {
          console.log("Clicked thumbs up")
          update(true)
        }
      }),
      h(ToolButton, {
        icon: 'thumbs-down',
        intent: isSet && !isApproved ? 'danger' : null,
        small: true,
        onClick() {
          console.log("Clicked thumbs down")
          update(false)
        }
      })
    ])
  ])
}


const ApprovalControls = (props)=>{
  const {annotation} = props
  const {actions} = useContext(AnnotationApproverContext) ?? {}
  if (actions == null) return null
  const approved = useAnnotationApproved(annotation)

  const tagChanged = false

  return h(ControlPanel, {className: 'approval-controls'}, [
    h(ThumbControls, {
      label: "Proposal",
      isApproved: approved.proposal,
      update(a: boolean) { actions.toggleProposalApproved(annotation, a) }
    }),
    h(ThumbControls, {
      label: "Classification",
      isApproved: approved.classification,
      update(a: boolean) { actions.toggleClassificationApproved(annotation, a) }
    }),
    h("div.tag-control", [
      h("span.label", "Tag"),
      h("div.buttons", [
        h(ToolButton, {
          icon: 'tag',
          intent: tagChanged ? 'success' : null,
          small: true,
          onClick() {
            actions.requestTagUpdate(annotation)
          }
        }),
      ])
    ])

  ])
}

export {ApprovalControls};
