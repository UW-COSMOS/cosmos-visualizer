import {useState, createContext, useContext, FC} from 'react'
import h from 'react-hyperscript'
import {TagRect} from '../image-overlay/types'

type SelectedAnnotation = TagRect|null

interface AnnotationsCtx {
  annotations: TagRect[],
  allowSelection: boolean,
  selected: SelectedAnnotation
}

const AnnotationsContext = createContext<AnnotationsCtx>({
  annotations: [],
  allowSelection: false,
  selected: null
})

type Updater = (v0: TagRect)=>void
const SelectionUpdateContext = createContext<Updater|null>(null)

interface ProviderProps {
  annotations: TagRect[],
  allowSelection?: boolean
}

const AnnotationsProvider: FC<ProviderProps> = (props)=>{
  /**
  Provides the ability to select an annotation
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

const useAnnotations = (): TagRect[] => useContext(AnnotationsContext).annotations
const useSelectionUpdater = ()=>useContext(SelectionUpdateContext)

export {
  AnnotationsProvider,
  AnnotationsContext,
  useAnnotations,
  useSelectionUpdater
}
