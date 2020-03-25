import h from '@macrostrat/hyper'
import {createContext, useContext, useState, useEffect} from 'react'
import {useAnnotations, useAnnotationIndex} from '~/providers/annotations'
import {useTags} from '~/providers/tags'
import axios from 'axios'
import {APIContext} from '~/api'
import {AnnotationTypeOmnibox} from '~/image-overlay/editing-overlay/type-selector'
import update, {MapSpec} from 'immutability-helper'

type UpdateSpec = object;

interface ApproverActions {
  toggleClassificationApproved(i: Annotation, good: boolean): void,
  toggleProposalApproved(i: Annotation, good: boolean): void,
  // Added update tag action
  requestTagUpdate(i: Annotation): void
}

interface AnnotationApproverCtx {
  actions: ApproverActions,
  isClassificationApproved: boolean[],
  isProposalApproved: boolean[]
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
}

const initialState: AnnotationApprovalState = {
  proposalApproved: {},
  classificationApproved: {}
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

async function updateTag(ann: ApprovableAnnotation, tag: Tag, data: APIResponseData) {

    const object_id = ann.obj_id

    let annotated_cls = tag.name;
    // Hack to allow deselection by selecting the same overridden tag
    // Should convert to a {remove} button or something
    if (annotated_cls == ann.annotated_cls) {
      annotated_cls = null
    }

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

    const data = {baseURL, pdf_name, page_num}
    async function thumbs(annotation: Annotation, opts: AnnotationApprovalStatus) {
        const res = await postAnnotationThumbs(annotation, data, opts)
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
          },
          requestTagUpdate(ann: Annotation) {
            setSelectionAnnotation(ann)
          }
        },
        isClassificationApproved,
        isProposalApproved
    }

    const tag = useTags().find(d => d.name == tagSelectionAnnotation?.name)

    return h(AnnotationApproverContext.Provider, {value}, [
      h.if(tag != null)(AnnotationTypeOmnibox, {
        selectedTag: tag,
        onSelectTag: (t: Tag)=>{
          const success = updateTag(tagSelectionAnnotation, t, data)
          const ix = cur_annotations.indexOf(tagSelectionAnnotation)
          if (success && ix != -1) {
            // Update tags to show success
          }
          setSelectionAnnotation(null)
        },
        onClose: ()=>setSelectionAnnotation(null),
        isOpen: tagSelectionAnnotation != null
      }),
      props.children
    ])
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
