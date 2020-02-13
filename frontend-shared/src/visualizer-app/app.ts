import h from 'react-hyperscript';
import {Route} from 'react-router-dom';
import {AppMode} from '../enum';
import {ResultsLandingPage} from './landing-page';
import {KnowledgeBaseFilterView} from './knowledge-base';
import {ViewerPage} from './page-interface'
import {AppRouter, permalinkRouteTemplate, PermalinkRoute} from '~/shared/router'

const App = (props) => {
  const appMode = AppMode.PREDICTION;
  const {publicURL} = props;
  return h(AppRouter, {basename: publicURL, appMode}, [
    h(Route, {
      path: '/',
      exact: true,
      component: ResultsLandingPage
    }),
    // Route for permalinks
    h(Route, {
      path: permalinkRouteTemplate(appMode),
      render: props=> {
        return h(ViewerPage, {
          nextImageEndpoint: "/image/next_prediction",
          subtitleText: "View extractions",
          ...props
        });
      }
    }),
    // This is probably deprecated
    h(Route, {
      path: '/view-extractions/:imageId?',
      render: props=> {
        return h(ViewerPage, {
          nextImageEndpoint: "/image/next_prediction",
          subtitleText: "View extractions",
          ...props
        });
      }
    }),
    h(Route, {
      path: '/knowledge-base',
      component: KnowledgeBaseFilterView
    })
  ]);
}

export {App};
