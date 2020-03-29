import { useLocation, useHistory } from 'react-router'
import queryString from 'query-string'

const useSearchString = ()=>{
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
