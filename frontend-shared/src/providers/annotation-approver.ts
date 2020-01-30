import h from 'react-hyperscript'
import {useContext, createContext} from 'react'
import {APIContext} from '../api';
import {AnnotationContext, Annotation, AnnotationRect} from './annotations'

import {TagRect} from '~/image-overlay/types'

type TagID = number;
type UpdateSpec = object;
type TagUpdater = (s: UpdateSpec)=>void

interface Annotation {
  boxes: AnnotationRect[],
  tag_id: TagID,
  name: string,
  score?: number,
}

type SelectedAnnotation = Annotation|null

interface AnnotationApproverProps {
  page_num: number,
  pdf_name: string,
  annotations: Annotation[],
}

interface AnnotationsCtx {
  annotations: Annotation[],
  allowSelection: boolean,
  selected: SelectedAnnotation
}
const AnnotationsContext = createContext<AnnotationsCtx>({
  annotations: [],
  allowSelection: true,
  selected: null
})

const AnnotationApproverProvider = (props: AnnotationApproverProps)=>{
  /** A more advanced annotation provider that allows for
    adding, removing, and editing the positions of annotations.
  */
  const {page_num, pdf_name, annotations} = props;
  const selected = null
  const value = {
    annotations,
    allowSelection: true,
    selected
  }
  const updateSelection = (ix: number)=>{
    setSelectedAnnotation(ix)
  }

  // There should be buttons. They should set classification_success, proposal_success, and note 
  // SEP wants there to be the ability to easily add additional buttons, as defined by a response, e.g. 
  // from http://cosmos1.chtc.wisc.edu:5080/search/object/annotate
  //
  var classification_success, proposal_success, note = null;
  var endpoint = `/search/object/annotate`
  var data = {
      coords : `({selectedAnnotation.bboxes[0][0]}, {selectedAnnotation.bboxes[0][1]})`,
      pdf_name,
      page_num,
      classification_success,
      proposal_success,
      note}
  try {
      var success = await this.context.post(endpoint, data)
  } 

  // ------------------- 

  return h(AnnotationsContext.Provider, {value}, [
    h(SelectionUpdateContext.Provider, {value: updateSelection}, children)
  ])
}

AnnotationApproverProvider.defaultProps = {
  initialAnnotations: []
}
