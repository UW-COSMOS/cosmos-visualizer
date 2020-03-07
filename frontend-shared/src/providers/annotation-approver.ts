import h from 'react-hyperscript'
import {createContext, useContext, useState, useEffect} from 'react'
import {
  Annotation,
  useAnnotations,
  useAnnotationIndex
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

const initialState: AnnotationApprovalState = {
  proposalApproved: {},
  classificationApproved: {}
}

const AnnotationApproverProvider = (props: AnnotationApproverProps)=>{
    const {pdf_name, page_num} = props
    const [state, setState] = useState<AnnotationApprovalState>(initialState)
    // Reset annotations on image change
    useEffect(() => setState(initialState), [pdf_name, page_num])

    const cur_annotations = useAnnotations()
    const {baseURL} = useContext(APIContext)

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
      const obj_id = ann.obj_id


       var endpoint = `${baseURL}/object/annotate`
       var data = {
           coords : `(${box[0]}, ${box[1]})`,
           pdf_name,
           page_num,
           object_id : obj_id,
           classification_success: opts?.classification,
           proposal_success: opts?.proposal,
           note: null
        }
       try {
           await axios.post(endpoint, data, {
             headers : {
               'Content-Type': 'application/x-www-form-urlencoded'
             }
           })
           return true
       } catch (err) {
         console.log(err)
         return false
       }
    }

    async function thumbs(annotation: Annotation, opts: AnnotationApprovalStatus) {
        const res = await postAnnotationThumbs(annotation, opts)
        //if (!res) return
        const ix = cur_annotations.findIndex(d => d == annotation)

        let spec: MapSpec<string, AnnotationApprovalMap> = {}

        // Check if classification or proposal booleans are provided,
        // and set appropriate part of state if not
        for (const k of ['classification', 'proposal']) {
          const value = opts[k]
          if (value == null) continue
          const stateKey = k+'Approved'
          const isAlreadySet = state[stateKey][ix] == value
          spec[stateKey] = {
            [ix]: {$set: isAlreadySet ? null : value}
          }
        }

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

function useAnnotationApproved(annotation: Annotation): AnnotationApprovalStatus|null {
  const ctx = useContext(AnnotationApproverContext)
  if (ctx == null) return null
  const {isProposalApproved, isClassificationApproved} = ctx
  const ix = useAnnotationIndex(annotation)
  return {
    classification: isClassificationApproved[ix],
    proposal: isProposalApproved[ix]
  }
}

export {
    AnnotationApproverContext,
    AnnotationApproverProvider,
    useAnnotationApproved
}
