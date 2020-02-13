import h from 'react-hyperscript'
import {createContext, useContext, useState} from 'react'
import {
  AnnotationsContext,
  Annotation,
  AnnotationRect,
  useAnnotations,
  SelectionUpdateContext
} from './annotations'
import axios from 'axios'
import {APIContext} from '~/api'
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

interface AnnotationApprovalStatus {
  classificationGood: boolean|null,
  proposalGood: boolean|null
}


const AnnotationApproverProvider = (props: AnnotationApproverProps)=>{
    const {pdf_name, page_num} = props
    const [state, setState] = useState<AnnotationApprovalState>({})

    const cur_annotations = useAnnotations()
    const {post} = useContext(APIContext)

    const isApprovedOrNot = cur_annotations.map((d, i) => {
        return state[i] ?? null
    })


    async function postAnnotationThumbs(ann: Annotation, classificationGood: boolean, proposalGood: boolean): boolean {

      const box = ann.boxes[0]

       var endpoint = `/search/object/annotate`
       var data = {
           coords : [box[0], box[1]],
           pdf_name,
           page_num,
           classification_success: classificationGood,
           proposal_success: proposalGood,
           note: null
        }
       try {
           var success = await post(endpoint, {}, data)
           return true
       } catch (err) {
         console.log(err)
         return false
       }
    }


    async function thumbs(annotation: Annotation, good: boolean) {
        //const res = await postAnnotationThumbs(annotation, good, null)
        //if (!res) return

        const i = cur_annotations.findIndex(d => d == annotation)
        let new_state = {...state}
        if (state[i] == good) {
            new_state[i] = null
        } else {
            new_state[i] = good
        }
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
