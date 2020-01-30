import {createContext, useContext} from 'react'
import h from 'react-hyperscript'

type TagID = string
interface Tag {
  color: string,
  name: string,
  tag_id: TagID
}

interface TagsCtx {tags: Tag[]}

const TagsContext = createContext<TagsCtx>({
  annotations: [],
  allowSelection: false,
  selectedAnnotation: null
})

const TagsProvider = (props: TagsCtx)=>{
  /**
  Provides the ability to select an annotation
  */
  const {children, tags} = props

  return h(TagsContext.Provider, {value: {tags}}, children)
}

const useTags = (): Tag[] => useContext(AnnotationsContext).annotations

export {
  TagID,
  Tag,
  TagsContext,
  TagsProvider,
  useTags
}
