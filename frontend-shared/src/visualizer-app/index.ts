

import "~/shared/_init"

import {render} from 'react-dom';
import h from 'react-hyperscript';
import {App} from './app';
import {APIProvider} from '../api';
import {ImageStoreProvider} from '../image-container';

const AppHolder = props => {
  const {baseURL, imageBaseURL, publicURL, ...rest} = props;
  return h(APIProvider, {baseURL}, [
    h(ImageStoreProvider, {baseURL: imageBaseURL, publicURL}, [
        h(App, {imageBaseURL, publicURL, ...rest})
    ])
  ]);
}

const createUI = function(opts){
  if (opts == null) { opts = {}; }
  let {baseURL, imageBaseURL, publicURL} = opts;

  try {
    // Attempt to set parameters from environment variables
    // This will fail if bundled on a different system, presumably,
    // so we wrap in try/catch.
    publicURL = process.env.PUBLIC_URL;
    baseURL = process.env.API_BASE_URL;
    imageBaseURL = process.env.IMAGE_BASE_URL;
  } catch (error) {
    console.log(error);
  }

  console.log(`\
Environment variables:
PUBLIC_URL: ${process.env.PUBLIC_URL}
API_BASE_URL: ${process.env.API_BASE_URL}
IMAGE_BASE_URL: ${process.env.IMAGE_BASE_URL}\
`
  );

  // Set reasonable defaults
  if (publicURL == null) { publicURL = "/"; }
  if (baseURL == null) { baseURL = "https://dev.macrostrat.org/image-tagger-api"; }
  if (imageBaseURL == null) { imageBaseURL = "https://dev.macrostrat.org/image-tagger/img/"; }

  console.log(publicURL, baseURL, imageBaseURL);

  // Image base url is properly set here
  const el = document.createElement('div');
  document.body.appendChild(el);
  const __ = h(AppHolder, {baseURL, imageBaseURL, publicURL});
  return render(__, el);
};

// Actually run the UI (changed for webpack)
createUI();
