import { useLocation, useHistory } from "react-router";
import queryString, { ParsedQuery } from "query-string";

type Updater = (q: ParsedQuery<string | number>) => void;
const useSearchString = (): [ParsedQuery<string | number>, Updater] => {
  const loc = useLocation();
  const history = useHistory();
  const searchString = queryString.parse(loc.search, {
    parseNumbers: true,
    arrayFormat: "comma",
  });

  const updateSearchString = (q) => {
    const qstr = queryString.stringify(q);
    history.push(loc.pathname + "?" + qstr);
  };

  return [searchString, updateSearchString];
};

export { useSearchString };
