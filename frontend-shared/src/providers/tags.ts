import {createContext, useContext} from 'react'
import h from 'react-hyperscript'
import chroma, {Color} from 'chroma-js'

type TagID = string
interface Tag {
  color: string,
  name: string,
  tag_id: TagID
}

const TagsContext = createContext<Tag[]>([])

const TagsProvider = (props: TagsCtx)=>{
  /**
  Provides the ability to select an annotation
  */
  const {children, tags} = props

  return h(TagsContext.Provider, {value: tags}, children)
}

const useTags = (): Tag[] => useContext(TagsContext)

function useTagColor(tag_id: string): Color {
  const tags = useTags()
  let color = tags.find(d => d.tag_id === tag_id)?.color ?? 'black'
  return chroma(color)
}

// useTagColorForName(name){
//   const tags = useTags();
//   let color = tags.find(d => d.name === name)?.color ?? 'black'
//   return chroma(tagData.color)
// }



export {
  TagID,
  Tag,
  TagsContext,
  TagsProvider,
  useTags,
  useTagColor
}
