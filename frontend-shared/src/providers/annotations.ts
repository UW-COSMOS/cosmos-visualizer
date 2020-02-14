import {useState, createContext, useContext} from 'react'
import h from 'react-hyperscript'
import {AnnotationArr, Annotation} from '../image-overlay/types'
import {TagID, useTags} from './tags'
import chroma from 'chroma-js'

type AnnotationRect = [number, number, number, number]
type AnnotationArr = [AnnotationRect, TagID, number]

// Really, this is an index
type AnnotationID = number
interface Annotation {
  boxes: AnnotationRect[],
  tag_id: TagID,
  // Potentially, the uuid of another tag on the page
  image_tag_id?: string,
  name: string,
  score?: number,
}

interface AnnotationsCtx {
  annotations: Annotation[],
  allowSelection: boolean,
  selected: AnnotationID
}

const AnnotationsContext = createContext<AnnotationsCtx>({
  annotations: [],
  allowSelection: false,
  selected: null
})

type Updater = (v0: Annotation)=>void
const SelectionUpdateContext = createContext<Updater|null>(null)


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

  const [selected, setSelected] = useState<AnnotationID>(null)

  const value = {
    annotations,
    allowSelection: allowSelection ?? false,
    selected: allowSelection? selected : null
  }

  let updateSelection = (annotation: Annotation)=>{
    const ix = annotations.findIndex(d => d == annotation)
    setSelected(ix)
  }

  if (!allowSelection) updateSelection = null

  return h(AnnotationsContext.Provider, {value}, [
    h(SelectionUpdateContext.Provider, {value: updateSelection}, children)
  ])
}

const useAnnotations = (): Annotation[] => useContext(AnnotationsContext).annotations

const useSelectedAnnotation = (): Annotation => {
  const {annotations, selected} = useContext(AnnotationsContext)
  return annotations[selected]
}
const useSelectionUpdater = ()=>useContext(SelectionUpdateContext)


function useAnnotationColor(a: Annotation): chroma.Color {
  const {name, tag_id} = a
  const tags = useTags()
  const idColor = tags.find(d => d.tag_id === tag_id)?.color
  const nameColor = tags.find(d => d.name === name)?.color
  return chroma(idColor ?? nameColor ?? 'black')
}

const useAnnotationIndex = (ann: Annotation):number =>{
  const {annotations, selected} = useContext(AnnotationsContext)
  /* It's most common to be testing for the selected annotation,
     so we check this first */
  if (ann == annotations[selected]) return selected
  return annotations.findIndex(d => ann == d)
}

export {
  AnnotationsProvider,
  AnnotationsContext,
  SelectionUpdateContext,
  useAnnotations,
  useAnnotationIndex,
  useSelectedAnnotation,
  useSelectionUpdater,
  useAnnotationColor,
  Annotation,
  AnnotationRect,
  AnnotationArr
}
