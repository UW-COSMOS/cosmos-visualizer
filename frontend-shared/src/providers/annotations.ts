import {useState, createContext, useContext} from 'react'
import h from 'react-hyperscript'
import {AnnotationArr, Annotation} from '../image-overlay/types'
import {TagID} from './tags'

type AnnotationRect = [number, number, number, number]
type AnnotationArr = [AnnotationRect, TagID, number]

interface Annotation {
  boxes: AnnotationRect[],
  tag_id: TagID,
  name: string,
  score?: number,
}

type SelectedAnnotation = Annotation|null

interface AnnotationsCtx {
  annotations: Annotation[],
  allowSelection: boolean,
  selected: SelectedAnnotation
}

const AnnotationsContext = createContext<AnnotationsCtx>({
  annotations: [],
  allowSelection: false,
  selected: null
})

type Updater = (v0: AnnotationRect)=>void
const SelectionUpdateContext = createContext<Updater|null>(null)


const normalizeAnnotation = function(d: AnnotationArr): Annotation {
  /*
  Temporary (?) function to normalize an annotation rectangle
  to the expected internal representation.
  */
  console.log(d);
  const boxes = [d[0]];
  const name = d[1];
  const score = d[2];
  return {boxes, name, score, tag_id: name};
};

interface ProviderProps {
  annotations: Annotation[],
  allowSelection?: boolean
}

const AnnotationsProvider = (props: ProviderProps)=>{
  /**
  Provides annotations to the page,
  Also allows selecting an annotation
  */
  const {children, annotations, allowSelection} = props

  const [selected, setSelected] = useState<SelectedAnnotation>(null)

  const value = {
    annotations,
    allowSelection: allowSelection ?? false,
    selected: allowSelection? selected : null
  }

  let updateSelection = allowSelection ? setSelected : null

  return h(AnnotationsContext.Provider, {value}, [
    h(SelectionUpdateContext.Provider, {value: updateSelection}, children)
  ])
}

const useAnnotations = (): Annotation[] => useContext(AnnotationsContext).annotations
const useSelectedAnnotation = (): Annotation => useContext(AnnotationsContext).selected
const useSelectionUpdater = ()=>useContext(SelectionUpdateContext)

export {
  AnnotationsProvider,
  AnnotationsContext,
  useAnnotations,
  useSelectedAnnotation,
  useSelectionUpdater,
  Annotation,
  AnnotationRect,
  AnnotationArr
}
