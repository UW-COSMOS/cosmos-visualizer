import "~/shared/_init";
import { render } from "react-dom";
import h from "react-hyperscript";
import { App } from "./app";
import { APIProvider } from "../api";
import { getEnvironmentConfig } from "~/shared/_env";

const AppHolder = (props) => {
  const { baseURL, imageBaseURL, publicURL, ...rest } = props;
  return h(APIProvider, { baseURL }, [
    h(App, { imageBaseURL, publicURL, ...rest }),
  ]);
};

const createUI = function (opts) {
  const env = getEnvironmentConfig(opts);
  // Image base url is properly set here
  const el = document.createElement("div");
  document.body.appendChild(el);
  const __ = h(AppHolder, { ...env });
  return render(__, el);
};

// Actually run the UI (changed for webpack)
createUI();
