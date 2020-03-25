import h from '@macrostrat/hyper'
import {createContext, useContext, useState, useEffect} from 'react'
import {
  useAnnotations,
  useAnnotationIndex
} from '~/providers/annotations'
import {useTags} from '~/providers/tags'
import axios from 'axios'
import {APIContext} from '~/api'
import {AnnotationTypeOmnibox} from '~/image-overlay/editing-overlay/type-selector'
import update, {Spec} from 'immutability-helper'

interface ApproverActions {
  toggleClassificationApproved(i: Annotation, good: boolean): void,
  toggleProposalApproved(i: Annotation, good: boolean): void,
  // Added update tag action
  requestTagUpdate(i: Annotation): void
}

interface AnnotationApproverCtx {
  actions: ApproverActions,
  isClassificationApproved: boolean[],
  isProposalApproved: boolean[],
  isClassApproved: string[]
}

const AnnotationApproverContext = createContext<AnnotationApproverCtx|null>(null)

type AnnotationApproverProps = React.PropsWithChildren<{
  page_num: number,
  pdf_name: string
}>

interface AnnotationApprovalMap {
    [ix: number]: boolean,
}

interface AnnotationApprovalState {
  proposalApproved: AnnotationApprovalMap,
  classificationApproved: AnnotationApprovalMap,
  annotatedClasses: {[ix: number]: string}
}

const initialState: AnnotationApprovalState = {
  proposalApproved: {},
  classificationApproved: {},
  // store in-progress annotated classes
  annotatedClasses: {}
}

interface APIResponseData {
  pdf_name: string,
  page_num: number,
  baseURL: string
}

async function postAnnotationThumbs(
  ann: Annotation,
  data: APIResponseData,
  opts: AnnotationApprovalStatus
): Promise<boolean> {

  const obj_id = ann.obj_id

  const {baseURL, ...rest} = data;
  const box = ann.boxes[0]
  const endpoint = `${baseURL}/object/annotate`
  const postData = {
     coords : `(${box[0]}, ${box[1]})`,
     ...rest,
     object_id: obj_id,
     classification_success: opts?.classification,
     proposal_success: opts?.proposal,
     note: null
  }

  try {
    await axios.post(endpoint, postData, {
      headers : {'Content-Type': 'application/x-www-form-urlencoded'}
    })
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

async function updateTag(ann: ApprovableAnnotation, annotated_cls: TagID, data: APIResponseData) {
    const object_id = ann.obj_id
    const {baseURL, ...rest} = data;
    const box = ann.boxes[0]
    const endpoint = `${baseURL}/object/annotate`
    const postData = {
       coords : `(${box[0]}, ${box[1]})`,
       ...rest,
       object_id,
       annotated_cls
    }

    try {
      const res = await axios.post(endpoint, postData, {
        headers : {'Content-Type': 'application/x-www-form-urlencoded'}
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
}

const AnnotationApproverProvider = (props: AnnotationApproverProps)=>{
    const {pdf_name, page_num} = props
    const [state, setState] = useState<AnnotationApprovalState>(initialState)
    const [tagSelectionAnnotation, setSelectionAnnotation] = useState<ApprovableAnnotation|null>(null)
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

    const isClassApproved = cur_annotations.map((d,i) => {
      return state.annotatedClasses[i] ?? null
    })

    const updateState = (spec)=>setState(update(state, spec))

    const data = {baseURL, pdf_name, page_num}
    async function thumbs(annotation: Annotation, opts: AnnotationApprovalStatus) {
        const res = await postAnnotationThumbs(annotation, data, opts)
        //if (!res) return
        const ix = cur_annotations.findIndex(d => d == annotation)

        let spec: Spec<AnnotationApprovalMap> = {}

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
          },
          requestTagUpdate(ann: Annotation) {
            setSelectionAnnotation(ann)
          }
        },
        isClassificationApproved,
        isProposalApproved,
        isClassApproved
    }

    const selectedTag = useTags().find(d => d.tag_id == tagSelectionAnnotation?.tag_id)

    async function onSelectTag(t: Tag) {
      // Hack to allow deselection by selecting the same overridden tag
      // Should convert to a {remove} button or something
      let annotated_cls = t.tag_id
      if (annotated_cls == tagSelectionAnnotation.annotated_cls) {
        annotated_cls = null
      }
      const success = await updateTag(tagSelectionAnnotation, annotated_cls, data)
      const ix = cur_annotations.indexOf(tagSelectionAnnotation)

      if (success && ix != -1) {
        const spec = {annotatedClasses: {[ix]: {$set: annotated_cls}}}
        updateState(spec)
      }
      setSelectionAnnotation(null)
    }

    return h(AnnotationApproverContext.Provider, {value}, [
      h(AnnotationTypeOmnibox, {
        selectedTag,
        onSelectTag,
        onClose: ()=>setSelectionAnnotation(null),
        isOpen: tagSelectionAnnotation != null
      }),
      props.children
    ])
}

function useAnnotationApproved(annotation: Annotation): AnnotationApprovalStatus|null {
  const ctx = useContext(AnnotationApproverContext)
  if (ctx == null) return null
  const {isProposalApproved, isClassificationApproved, isClassApproved} = ctx
  const ix = useAnnotationIndex(annotation)
  return {
    classification: isClassificationApproved[ix],
    proposal: isProposalApproved[ix],
    annotated_cls: isClassApproved[ix]
  }
}

export {
    AnnotationApproverContext,
    AnnotationApproverProvider,
    useAnnotationApproved
}
