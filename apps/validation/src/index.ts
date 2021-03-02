import "~/shared/_init";
import { render } from "react-dom";
import h, { compose, C } from "@macrostrat/hyper";
import { App } from "./app";
import { APIProvider } from "~/api";

const AppHolder = () => {
  const publicURL = process.env.PUBLIC_URL;
  const baseURL = process.env.API_BASE_URL;
  // Nest a bunch of providers
  return h(compose(C(APIProvider, { baseURL }), C(App, { publicURL })));
};

const el = document.createElement("div");
document.body.appendChild(el);
render(h(AppHolder), el);
