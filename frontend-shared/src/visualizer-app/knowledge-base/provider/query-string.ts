import { useLocation, useHistory } from "react-router";
import queryString, { ParsedQuery } from "query-string";

type Updater = (q: ParsedQuery<string | number>) => void;
const useSearchString = (): [ParsedQuery<string | number>, Updater] => {
  const loc = useLocation();
  const history = useHistory();
  let searchString = queryString.parse(loc.search, {
    parseNumbers: true,
    arrayFormat: "comma",
  });

  // Reassemble query string if we've parsed it into an array
  if (Array.isArray(searchString.query)) {
    searchString.query = searchString.query.join(",");
  }

  const updateSearchString = (q) => {
    // Don't update the search string unless we actually have conducted a search
    if (q.query == "") return;
    const qstr = queryString.stringify(q);
    if (qstr == null || qstr == "") return;
    history.push(loc.pathname + "?" + qstr);
  };

  return [searchString, updateSearchString];
};

export { useSearchString };
