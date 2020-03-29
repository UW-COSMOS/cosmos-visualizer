import h from 'react-hyperscript';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {AppMode} from '~/enum';
import {PermalinkProvider} from './permalinks';

// /annotation/{stack_id}/page/{image_id}

const AppRouter = ({appMode, basename, ...rest}) => {
  return h(PermalinkProvider, {appMode}, (
    h('div.app-main.bp3-dark', null, [
      h(Router, {basename}, (
        h(Switch, rest)
      ))
    ])
  ))
};

export * from './permalinks'
export {AppRouter, Route}
