import h from 'react-hyperscript'
import {createContext, useContext, useState} from 'react'
import {
  AnnotationsContext,
  Annotation,
  AnnotationRect,
  useAnnotations,
  SelectionUpdateContext
} from './annotations'
import {TagID, Tag, TagsContext} from './tags'
import {isDifferent} from './util'
import uuidv4 from 'uuid/v4';
import {StatefulComponent} from '@macrostrat/ui-components';
import {Spec} from 'immutability-helper'

type AnnotationID = number;
type UpdateSpec = object;
type TagUpdater = (s: UpdateSpec)=>void

interface ApproverActions {
  toggleThumbsUp(i: Annotation, good: boolean): void,
}

interface AnnotationApproverCtx {
  actions: ApproverActions,
  isAnnotationApproved: boolean[],
}

const AnnotationApproverContext = createContext<AnnotationApproverCtx|null>(null)

interface AnnotationApproverProps {
  page_num: number,
  pdf_name: string,
  children: React.ReactNode
}

interface AnnotationApprovalState {
    [ix: number]: boolean
}

const AnnotationApproverProvider = (props: AnnotationApproverProps)=>{
    const [state, setState] = useState<AnnotationApprovalState>({})

    const cur_annotations = useAnnotations()

    const isApprovedOrNot = cur_annotations.map((d, i) => {
        return state[i] ?? null
    })

    const thumbs = (annotation: Annotation, good: boolean) => {
        const i = cur_annotations.findIndex(d => d == annotation)
        let new_state = {...state}
        if (state[i] == good) {
            new_state[i] = null
        } else {
            new_state[i] = good
        }
        // TODO: POST to API, if successful, then set state
        //  var endpoint = `/search/object/annotate`
        //  var data = {
        //      coords : `({selectedAnnotation.bboxes[0][0]}, {selectedAnnotation.bboxes[0][1]})`,
        //      pdf_name,
        //      page_num,
        //      classification_success,
        //      proposal_success,
        //      note}
        //  try {
        //      var success = await this.context.post(endpoint, data)
        //  }
        setState(new_state)
    }

    const value = {
        actions : {
            toggleThumbsUp : thumbs
        },
        isAnnotationApproved : isApprovedOrNot
    }

    return h(AnnotationApproverContext.Provider, {value}, props.children)
}

export {
    AnnotationApproverContext,
    AnnotationApproverProvider
}
