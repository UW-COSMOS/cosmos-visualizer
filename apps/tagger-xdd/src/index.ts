import "~/shared/_init";
import { render } from "react-dom";
import h, { compose, C } from "@macrostrat/hyper";
import { APIProvider } from "~/api";
import { ImageStoreProvider } from "./page-interface";
import { TaggingApplication } from "./app";

const App = () => {
  const publicURL = process.env.PUBLIC_URL;
  const baseURL = process.env.XDD_BASE_URL + "/tagger/api";
  const imageBaseURL = process.env.XDD_BASE_URL + "/tagger/images";
  // Nest a bunch of providers
  return h(
    compose(
      C(APIProvider, { baseURL }),
      C(ImageStoreProvider, { baseURL: imageBaseURL }),
      C(TaggingApplication, { publicURL })
    )
  );
};

const el = document.createElement("div");
document.body.appendChild(el);
render(h(App), el);
