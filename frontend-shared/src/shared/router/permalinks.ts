import {Component, createContext, useContext} from 'react';
import h from 'react-hyperscript';
import {useRouteMatch} from 'react-router-dom';
import {LinkButton} from '@macrostrat/ui-components';
import T from 'prop-types';

import {AppMode} from '~/enum';
import {Image, ImageShape} from '~/types';

const PermalinkContext = createContext({});

const permalinkRouteTemplate = appMode => `/${appMode}/:stackId/page/:imageId`;

class PermalinkProvider extends Component {

  static propTypes = {
    appMode: T.oneOf([
      AppMode.ANNOTATION,
      AppMode.PREDICTION
    ])
  };

  permalinkTo = ({stack_id, image_id}) => {
    const {pageTemplate} = this.getValue();
    return pageTemplate
      .replace(":stackId",stack_id)
      .replace(":imageId",image_id);
  }

  getValue = () => {
    const {appMode} = this.props;
    const {permalinkTo} = this;
    const pageTemplate = permalinkRouteTemplate(appMode);
    return {appMode, pageTemplate, permalinkTo};
  }

  render() {
    const {appMode, ...rest} = this.props;
    const value = this.getValue();
    return h(PermalinkContext.Provider, {value, ...rest});
  }
}

interface PermalinkButtonProps {
  image: Image
}

const PermalinkButton = function(props: PermalinkButtonProps){
  const {image} = props;
  const ctx = useContext(PermalinkContext);
  const {params: {imageId, stackId}} = useRouteMatch();
  if (image == null) { return null; }
  const {image_id, stack_id} = image;
  let text = "Permalink";
  let disabled = false;

  if ((image_id === imageId) && (stack_id === stackId)) {
    // We are at the permalink right now
    disabled = true;
    text = [h('span', [text, " to image "]), h('code', image_id)];
  }
  return h(LinkButton, {
    icon: 'bookmark',
    to: ctx.permalinkTo({stack_id, image_id}),
    disabled,
    text
  });
};

PermalinkButton.propTypes = {
  image: ImageShape
};

export {
  PermalinkButton,
  PermalinkProvider,
  PermalinkContext,
  permalinkRouteTemplate
};
