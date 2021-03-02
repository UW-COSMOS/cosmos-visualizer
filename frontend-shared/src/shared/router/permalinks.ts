import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";
import { useParams } from "react-router-dom";
import { LinkButton } from "@macrostrat/ui-components";

import { AppMode } from "~/enum";
import { Image, ImageShape } from "~/types";
import { useStack } from "~/providers/stack";

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
  stack_id: string;
}

const PermalinkProvider = (props: PermalinkProviderProps) => {
  const { routeTemplate, children } = props;

  function permalinkTo(permalinkInfo: PermalinkData) {
    const { stack_id, image_id } = permalinkInfo;
    return routeTemplate
      .replace(":stackId", stack_id)
      .replace(":imageId", image_id);
  }

  const value = { routeTemplate, permalinkTo };

  return h(PermalinkContext.Provider, { value, children });
};

interface PermalinkButtonProps {
  image: Image;
}

const PermalinkButton = function (props: PermalinkButtonProps) {
  const { image } = props;
  const ctx = useContext(PermalinkContext);
  const { imageId } = useParams();
  const stack = useStack();

  if (image == null) {
    return null;
  }
  const { image_id } = image;
  let text = "Permalink";
  let disabled = false;

  if (image_id === imageId && imageId != null) {
    // We are at the permalink right now
    disabled = true;
    text = [h("span", [text, " to image "]), h("code", image_id)];
  }
  return h(LinkButton, {
    icon: "bookmark",
    to: ctx.permalinkTo({ image_id, stack_id: stack }),
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
