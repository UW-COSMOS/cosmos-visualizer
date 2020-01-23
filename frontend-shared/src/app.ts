/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import {AppMode} from './enum';
import {ResultsLandingPage} from './landing-page';
import {KnowledgeBaseFilterView} from './knowledge-base';
import {ViewerPage} from './page-interface'
import {
  PermalinkProvider,
  permalinkRouteTemplate
} from './permalinks';

// /annotation/{stack_id}/page/{image_id}


const MainRouter = ({appMode, basename, ...rest}) => {
  return h(PermalinkProvider, {appMode}, (
    h('div.app-main', null, [
      h(Router, {basename}, (
        h(Switch, rest)
      ))
    ])
  ))
};

const App = (props) => {
  const appMode = AppMode.PREDICTION;
  const {publicURL} = props;
  return h(MainRouter, {basename: publicURL, appMode}, [
    h(Route, {
      path: '/',
      exact: true,
      component: ResultsLandingPage
    }),
    h(Route, {
      path: permalinkRouteTemplate(appMode),
      render: props=> {
        return h(ViewerPage, {
          permalinkRoute: "/training/page",
          nextImageEndpoint: "/image/validate",
          subtitleText: "View training data",
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
    // h PermalinkRoute, {
    //   component: ViewResults
    // }
    h(Route, {
      path: '/knowledge-base',
      component: KnowledgeBaseFilterView
    })
  ]);
}

export {App};
