import {Component} from 'react';
import h from 'react-hyperscript';
import {AppToaster} from './toaster';
import {Intent} from '@blueprintjs/core';
import {
  APIContext,
  APIProvider
} from '@macrostrat/ui-components';


const ErrorMessage = props=> {
  let {title, error, method, endpoint, data} = props;
  if (method == null) { method = 'GET'; }
  if (title == null) { title = 'API error'; }

  const message = h('div.error-toast', [
    h('h4', title),
    h('div.details', [
      h('div.error-message', error),
      h('div', [
        h('code', method),
        " to endpoint ",
        h('code', endpoint),
        " failed."
      ]),
      data ? h("pre", JSON.stringify(data, null, 2)) : null
    ])
  ]);

  return {message, intent: Intent.DANGER};
};

class APIProviderShim extends Component {
  static initClass() {
    this.defaultProps = {
      baseURL: null
    };
  }
  onError(route, opts){
    const {error} = opts;
    return AppToaster.show(ErrorMessage({
      title: "Invalid API response.",
      method: 'GET',
      endpoint: route,
      message: error.toString()
    }));
  }

  render() {
    const {baseURL, ...rest} = this.props;
    const {onError} = this;
    return h(APIProvider, {
      baseURL,
      onError,
      unwrapResponse(res){
        return res.data;
      },
      ...rest
    });
  }
}
APIProviderShim.initClass();

export {
  APIProviderShim as APIProvider,
  APIContext,
  ErrorMessage
};
