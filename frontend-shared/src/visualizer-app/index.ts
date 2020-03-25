import "~/shared/_init"
import {render} from 'react-dom';
import h from 'react-hyperscript';
import {APIProvider} from '../api';
import {getEnvironmentConfig} from '~/shared/_env'
import {Route} from 'react-router-dom';
import {AppMode} from '../enum';
import {ResultsLandingPage} from './landing-page';
import {KnowledgeBaseFilterView} from './knowledge-base';
import {AppRouter} from '~/shared/router'

const App = (props) => {
  const appMode = AppMode.PREDICTION;
  const {publicURL} = props;
  return h(AppRouter, {basename: publicURL, appMode}, [
    h(Route, {
      path: '/',
      exact: true,
      component: ResultsLandingPage
    }),
    h(Route, {
      path: '/knowledge-base',
      component: KnowledgeBaseFilterView
    })
  ]);
}

const AppHolder = props => {
  const {baseURL, imageBaseURL, publicURL, ...rest} = props;
  return h(APIProvider, {baseURL}, [
    h(App, {imageBaseURL, publicURL, ...rest})
  ]);
}

const createUI = function(opts={}){
  const env = getEnvironmentConfig(opts)
  // Image base url is properly set here
  const el = document.createElement('div');
  document.body.appendChild(el);
  const __ = h(AppHolder, {...env});
  return render(__, el);
};

// Actually run the UI (changed for webpack)
createUI();
