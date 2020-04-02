import { useLocation, useHistory } from 'react-router'
import queryString, {ParsedQuery} from 'query-string'

type Updater = (q: ParsedQuery)=>void
const useSearchString = (): [ParsedQuery, Updater]=>{
  const loc = useLocation()
  const history = useHistory()
  const searchString = queryString.parse(loc.search)

  const updateSearchString = (q)=>{
    const qstr = queryString.stringify(q)
    history.push(loc.pathname+"?"+qstr)
  }

  return [searchString, updateSearchString]
}

export {useSearchString}
