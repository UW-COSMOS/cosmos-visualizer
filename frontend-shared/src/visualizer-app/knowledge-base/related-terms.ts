import h from '@macrostrat/hyper'
import {useAPIResult, APIProvider, APIResultView} from '@macrostrat/ui-components'

const WordRelatedTerms = (props: {word: string})=>{
  const {word} = props
  const res = useAPIResult("/similar_terms", {term: word.toLowerCase()}, {debounce: 1000})

  const params = {term: word}
  if (res == null) return null
  return h([
    h("dt", word),
    res.map(d => h("dd", d[0]))
  ])
}

const RelatedTerms = (props: {query: string})=>{
  const {query} = props
  if (query == null || query == "") return null
  const words = query.split(" ")
  return h("div.related-terms", [
    h("h3", "Related terms"),
    h(APIProvider, {
      baseURL: "https://geodeepdive.org/api",
      unwrapResponse: (d)=>d.success.data
    },
      h("dl.terms", words.map(w => h(WordRelatedTerms, {word: w})))
    )
  ])
}

export {RelatedTerms}
