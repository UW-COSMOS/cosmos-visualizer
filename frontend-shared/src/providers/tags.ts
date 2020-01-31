import {createContext, useContext} from 'react'
import h from 'react-hyperscript'
import chroma, {Color} from 'chroma-js'
import {useAPIResult} from '@macrostrat/ui-components'

type TagID = number
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

function useTagColor(tag_id: number): Color {
  const tags = useTags()
  let color = tags.find(d => d.tag_id === tag_id)?.color ?? 'black'
  return chroma(color)
}

function useTagColorForName(tag_name: string): Color {
  const tags = useTags()
  let color = tags.find(d => d.name === tag_name)?.color ?? 'black'
  return chroma(color)
}

// useTagColorForName(name){
//   const tags = useTags();
//   let color = tags.find(d => d.name === name)?.color ?? 'black'
//   return chroma(tagData.color)
// }

const parseResponse = (cscale)=>(d, ix)=>{
  let {tag_id, color, name} = d;

  if (name == null) {
    name = tag_id.replace("-", " ");
    name = name.charAt(0).toUpperCase()+name.slice(1);
  }
  if (color == null) { color = cscale[ix]; }
  return {tag_id, color, name}
}

const APITagsProvider = (props)=>{
  const {children} = props
  const data = useAPIResult("/tags/all") ?? []
  const cscale = chroma.scale('viridis').colors(data.length);

  return h(TagsProvider, {
    tags: data.map(parseResponse(cscale))
  }, children)
}



export {
  TagID,
  Tag,
  TagsContext,
  TagsProvider,
  APITagsProvider,
  useTags,
  useTagColor,
  useTagColorForName
}
