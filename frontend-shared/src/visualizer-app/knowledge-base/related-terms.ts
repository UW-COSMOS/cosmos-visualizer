import h from "@macrostrat/hyper";
import { useAppState, useAppDispatch } from "./provider";
import { useContext } from "react";
import { Word2VecAPIContext, RelatedTermsCard } from "~/related-terms";
import {
  AnchorButton,
  Intent,
  Tooltip,
  IButtonProps,
  Position,
} from "@blueprintjs/core";

type RelatedPanelState = { canOpen: boolean; isOpen: boolean; words: string[] };

const useRelatedPanelState = (): RelatedPanelState => {
  const { filterParams, relatedPanelOpen } = useAppState();
  const { query } = filterParams;
  let words = (query ?? "").split(" ");

  const canOpen = query != null && query != "";
  return {
    words,
    canOpen,
    isOpen: relatedPanelOpen && canOpen,
  };
};

const RelatedTerms = () => {
  const { words, isOpen } = useRelatedPanelState();
  const ctx = useContext(Word2VecAPIContext);
  const dispatch = useAppDispatch();

  if (ctx == null) return null;

  return h(RelatedTermsCard, {
    words,
    isOpen,
    onClose() {
      dispatch({ type: "toggle-related-panel", value: false });
    },
  });
};

const RelatedTermsButton = (props: IButtonProps) => {
  const { isOpen, canOpen } = useRelatedPanelState();
  const dispatch = useAppDispatch();

  return h(
    Tooltip,
    {
      content: `${isOpen ? "Hide" : "Show"} related terms`,
      position: Position.BOTTOM,
    },
    h(AnchorButton, {
      icon: "properties",
      minimal: true,
      intent: !isOpen ? Intent.PRIMARY : null,
      disabled: !canOpen,
      onClick() {
        if (!canOpen) return;
        dispatch({ type: "toggle-related-panel" });
      },
      ...props,
    })
  );
};

export { RelatedTerms, RelatedTermsButton, useRelatedPanelState };
