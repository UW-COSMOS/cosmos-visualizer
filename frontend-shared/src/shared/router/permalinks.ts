import { Component, createContext, useContext } from "react";
import h from "react-hyperscript";
import { useRouteMatch } from "react-router-dom";
import { LinkButton } from "@macrostrat/ui-components";
import T from "prop-types";

import { AppMode } from "~/enum";
import { Image, ImageShape } from "~/types";

const PermalinkContext = createContext({});

const permalinkRouteTemplate = (appMode: AppMode): string => {
  return `/${appMode}/page/:imageId`;
};

interface PermalinkProviderProps {
  appMode: AppMode;
  children: React.ReactNode;
}

interface PermalinkData {
  image_id: string;
}

const PermalinkProvider = (props: PermalinkProviderProps) => {
  const { appMode, ...rest } = props;

  const pageTemplate = permalinkRouteTemplate(appMode);

  function permalinkTo(permalinkInfo: PermalinkData) {
    const { stack_id, image_id } = permalinkInfo;
    return pageTemplate
      .replace(":stackId", stack_id)
      .replace(":imageId", image_id);
  }

  const value = { appMode, pageTemplate, permalinkTo };

  return h(PermalinkContext.Provider, { value, ...rest });
};

interface PermalinkButtonProps {
  image: Image;
}

const PermalinkButton = function (props: PermalinkButtonProps) {
  const { image } = props;
  console.log(image);
  const ctx = useContext(PermalinkContext);
  const {
    params: { imageId },
  } = useRouteMatch();

  if (image == null) {
    return null;
  }
  const { _id: image_id } = image;
  let text = "Permalink";
  let disabled = false;

  if (image_id === imageId) {
    // We are at the permalink right now
    disabled = true;
    text = [h("span", [text, " to image "]), h("code", image_id)];
  }
  return h(LinkButton, {
    icon: "bookmark",
    to: ctx.permalinkTo({ image_id }),
    disabled,
    text,
  });
};

PermalinkButton.propTypes = {
  image: ImageShape,
};

export {
  PermalinkButton,
  PermalinkProvider,
  PermalinkContext,
  permalinkRouteTemplate,
};
