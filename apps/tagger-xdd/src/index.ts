import "~/shared/_init";
import { render } from "react-dom";
import h, { compose, C } from "@macrostrat/hyper";
import { APIProvider } from "~/api";
import { TaggingApplication } from "./app";

const App = () => {
  const publicURL = process.env.PUBLIC_URL;
  const baseURL = process.env.XDD_BASE_URL + "/tagger/api";
  // Nest a bunch of providers
  return h(
    compose(C(APIProvider, { baseURL }), C(TaggingApplication, { publicURL }))
  );
};

const el = document.createElement("div");
document.body.appendChild(el);
render(h(App), el);
