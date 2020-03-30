import h from '@macrostrat/hyper'
import {useAPIResult, APIProvider, APIResultView} from '@macrostrat/ui-components'

const WordRelatedTerms = (props: {word: string})=>{
  const {word} = props
  const res = useAPIResult("/word2vec", {
    word: word.toLowerCase().replace(" ", "_"),
    model: 'trigram'
  }, {debounce: 1000})

  const params = {term: word}
  if (res == null) return null
  return h([
    h("dt", word),
    res.map(d => h("dd", d[0].replace("_", " ")))
  ])
}

const RelatedTerms = (props: {query: string})=>{
  const {query} = props
  if (query == null || query == "") return null
  let words = query.split(" ")
  // Up to three words can form a trigram
  if (words.length <= 3) words = [words.join(" ")]

  return h("div.related-terms", [
    h("h3", "Related terms"),
    h(APIProvider, {
      baseURL: "http://cosmos3.chtc.wisc.edu:5003",
      unwrapResponse: (d)=>d.data
    },
      h("dl.terms", words.map(w => h(WordRelatedTerms, {word: w})))
    )
  ])
}

export {RelatedTerms}
