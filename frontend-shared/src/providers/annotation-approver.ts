import h from 'react-hyperscript'
import {createContext, useContext, useState} from 'react'
import {
  Annotation,
  useAnnotations,
} from './annotations'
import axios from 'axios'
import {APIContext} from '~/api'
import update, {MapSpec} from 'immutability-helper'

type UpdateSpec = object;

interface ApproverActions {
  toggleClassificationApproved(i: Annotation, good: boolean): void,
  toggleProposalApproved(i: Annotation, good: boolean): void
}

interface AnnotationApproverCtx {
  actions: ApproverActions,
  isClassificationApproved: boolean[],
  isProposalApproved: boolean[]
}

const AnnotationApproverContext = createContext<AnnotationApproverCtx|null>(null)

interface AnnotationApproverProps {
  page_num: number,
  pdf_name: string,
  children: React.ReactNode
}

interface AnnotationApprovalMap {
    [ix: number]: boolean,
}

interface AnnotationApprovalState {
  proposalApproved: AnnotationApprovalMap,
  classificationApproved: AnnotationApprovalMap
}

interface AnnotationApprovalStatus {
  classification?: boolean|null,
  proposal?: boolean|null
}


const AnnotationApproverProvider = (props: AnnotationApproverProps)=>{
    const {pdf_name, page_num} = props
    const [state, setState] = useState<AnnotationApprovalState>({
      proposalApproved: {},
      classificationApproved: {}
    })

    const cur_annotations = useAnnotations()
    const {post} = useContext(APIContext)

    const isClassificationApproved = cur_annotations.map((d, i) => {
        return state.classificationApproved[i] ?? null
    })

    const isProposalApproved = cur_annotations.map((d, i) => {
        return state.proposalApproved[i] ?? null
    })

    async function postAnnotationThumbs(
      ann: Annotation,
      opts: AnnotationApprovalStatus
    ): Promise<boolean> {


      const box = ann.boxes[0]

       var endpoint = `/search/object/annotate`
       var data = {
           coords : [box[0], box[1]],
           pdf_name,
           page_num,
           classification_success: opts?.classification,
           proposal_success: opts?.proposal,
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

    async function thumbs(annotation: Annotation, opts: AnnotationApprovalStatus) {
        //const res = await postAnnotationThumbs(annotation, good, null)
        //if (!res) return
        const ix = cur_annotations.findIndex(d => d == annotation)

        let spec: MapSpec<string, AnnotationApprovalMap> = {}

        console.log(opts)

        if (opts?.classification != null) {
          const isAlreadySet = state.classificationApproved[ix] == opts.classification
          spec.classificationApproved = {
            $set: {[ix]: isAlreadySet ? null : opts.classification}
          }
        }

        if (opts?.proposal != null) {
          const isAlreadySet = state.proposalApproved[ix] == opts.proposal
          spec.proposalApproved = {
            $set: {[ix]: isAlreadySet ? null : opts.proposal}
          }
        }

        console.log(spec)

        setState(update(state, spec))
    }

    const value = {
        actions : {
          toggleClassificationApproved(ann: Annotation, res: boolean) {
            thumbs(ann, {classification: res})
          },
          toggleProposalApproved(ann: Annotation, res: boolean) {
            thumbs(ann, {proposal: res})
          }
        },
        isClassificationApproved,
        isProposalApproved
    }

    return h(AnnotationApproverContext.Provider, {value}, props.children)
}

export {
    AnnotationApproverContext,
    AnnotationApproverProvider
}
