import h from 'react-hyperscript'
import {createContext, useContext} from 'react'

interface TagSelectionState {
  currentTag: number|null,
  lockedTags: number[],
}

const TagSelectionContext = createContext<TagSelectionState>({
  currentTag: null,
  lockedTags: []
})

const TagSelectionProvider = (props)=>{
  const {children} = props
  return h(TagSelectionContext.Provider, {value}, children)
}

export {TagSelectionProvider, TagSelectionContext}
