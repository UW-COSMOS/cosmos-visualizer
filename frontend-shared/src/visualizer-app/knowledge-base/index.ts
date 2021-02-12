import h from "@macrostrat/hyper";
import { useAPIResult, LinkButton } from "@macrostrat/ui-components";
import { Navbar } from "./components";

import { Footer } from "../landing-page";
import { useRouteMatch, useParams, Route, Switch } from "react-router-dom";
import "./main.styl";
import { SearchPage, DocumentResults } from "./search-page";

function PermalinkPage({ backURL }) {
  const { id } = useParams();
  const res = useAPIResult(`/object/${id}`);
  console.log(res);

  if (res?.objects == null) return null;
  return h("div.permalink-page", [
    h(Navbar, [
      h("div.spacer"),
      h.if(backURL)(
        LinkButton,
        { to: backURL, icon: "search", minimal: true },
        "Explore extractions"
      ),
    ]),
    h(DocumentResults, { data: res.objects }),
    h("div.spacer"),
    h(Footer),
  ]);
}

const KnowledgeBaseFilterView = (props: KBProps) => {
  const { url } = useRouteMatch();
  return h(Switch, [
    h(Route, {
      path: url + "/object/:id",
      render() {
        return h(PermalinkPage, { backURL: url });
      },
    }),
    h(Route, {
      path: url + "/",
      render: () => h(SearchPage, props),
    }),
  ]);
};

export { KnowledgeBaseFilterView };
