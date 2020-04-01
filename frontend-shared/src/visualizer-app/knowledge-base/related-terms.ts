import h from '@macrostrat/hyper'
import {useAPIResult, APIProvider, APIResultView} from '@macrostrat/ui-components'
import {useAppState, useAppDispatch} from './provider'
import {CollapseCard} from '~/shared/ui'
import {Button, Intent, Tooltip, IButtonProps} from '@blueprintjs/core'

const WordRelatedTerms = (props: {word: string})=>{
  const {word} = props
  const res = useAPIResult("/word2vec", {
    word: word.replace(" ", "_"),
    model: 'trigram'
  })

  const params = {term: word}
  if (res == null || res.length == 0) return null
  return h([
    h("dt", word),
    res.map(d => h("dd", d[0].replace("_", " ")))
  ])
}

type RelatedPanelState = {canOpen: boolean, isOpen: boolean, words: string[]}

const useRelatedPanelState = (): RelatedPanelState =>{
  const {filterParams, relatedPanelOpen} = useAppState()
  const {query} = filterParams
  let words = (query ?? "").split(" ")
  // Up to three words can form a trigram
  if (words.length <= 3) words = [words.join(" ")]

  const canOpen = query != null && query != ""
  return {
    words,
    canOpen,
    isOpen: relatedPanelOpen && canOpen
  }
}

const RelatedTerms = ()=>{
  const {words, isOpen} = useRelatedPanelState()
  const dispatch = useAppDispatch()

  return h(CollapseCard, {isOpen, className: "related-terms"}, [
    h("h3", "Related terms"),
    h.if(isOpen)(APIProvider, {
      baseURL: "http://cosmos3.chtc.wisc.edu:5003",
      unwrapResponse: (d)=>d.data
    },
      h("dl.terms", words.map(w => h(WordRelatedTerms, {word: w})))
    ),
    h("div.right-controls", null,
      h(Button, {
        icon: "cross",
        intent: Intent.DANGER,
        minimal: true,
        onClick() {
          dispatch({type: "toggle-related-panel", value: false})
        }
      })
    ),

  ])
}

const RelatedTermsButton = (props: IButtonProps)=>{
  const {isOpen, canOpen} = useRelatedPanelState()
  const dispatch = useAppDispatch()

  return h(Tooltip, {content: `${isOpen ? "Hide" : "Show"} related terms`},
    h(Button, {
      icon: "properties",
      minimal: true,
      intent: !isOpen ? Intent.PRIMARY : null,
      disabled: !canOpen,
      onClick() {
        if (!canOpen) return
        dispatch({type: "toggle-related-panel"})
      },
      ...props
    })
  )
}

export {RelatedTerms, RelatedTermsButton, useRelatedPanelState}
