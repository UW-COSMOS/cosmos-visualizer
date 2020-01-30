import h from 'react-hyperscript'
import {useContext, createContext} from 'react'
import {useImmutableState} from '@macrostrat/ui-components'
import {AnnotationContext, Annotation} from './annotations'

import {TagRect} from '~/image-overlay/types'

type TagID = number;
type UpdateSpec = object;
type TagUpdater = (s: UpdateSpec)=>void

export interface AnnotationActions {
  appendAnnotation(r: TagRect): void,
  deleteAnnotation(i: TagID): void,
  selectAnnotation(i: TagID): ()=>void,
  updateAnnotation(i: TagID): TagUpdater,
  addLink(i: TagID): ()=>void,
  toggleTagLock(i: TagID): ()=>void,
  updateCurrentTag(i: TagID): ()=>void,
  // This should not be passed through...
  //updateState(spec: UpdateSpec): void
}


const AnnotationActionsContext = createContext<AnnotationActionsCtx>()

interface AnnotationEditorProps {
  initialAnnotations: Annotation[]
}

const AnnotationEditorProvider = (props: AnnotationEditorProps)=>{
  /** A more advanced annotation provider that allows for
    adding, removing, and editing the positions of annotations.
  */
  const {children, initialAnnotations} = props;

  const [annotations, updateState] = useImmutableState(initialAnnotations)

  const selected = null

  const value = {
    annotations,
    allowSelection: true,
    selected
  }

  const updateSelection = (ix: number)=>{
    setSelectedAnnotation(ix)
  }

  return h(AnnotationsContext.Provider, {value}, [
    h(SelectionUpdateContext.Provider, {value: updateSelection}, children)
  ])
}

AnnotationEditorProvider.defaultProps = {
  initialAnnotations: []
}
