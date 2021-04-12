import { Word2VecAPIContext, Word2VecAPIProvider } from "./provider";

import h from "@macrostrat/hyper";
import { useAPIResult, useAPIHelpers } from "@macrostrat/ui-components";
import { useState } from "react";
import { CollapseCard } from "~/shared/ui";
import {
  Button,
  AnchorButton,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
} from "@blueprintjs/core";
import { format } from "d3-format";
import { findBestModel, joinWords } from "./util";

const fmt = format(".3f");

type WordResult = [string, number];

const TermResult = (props: { data: WordResult }) => {
  const [word, corr] = props.data;
  return h("li", [
    h("span.word", word.replace("_", " ")),
    h("span.correlation", fmt(corr)),
  ]);
};

const TermResults = (props: { words: WordResult[] | null }) => {
  const { words } = props;
  if (words == null || words.length == 0)
    return h("p.no-results", "No results");
  return h(
    "ul.term-results",
    words.map((d, i) => h(TermResult, { key: i, data: d }))
  );
};

type WordRelatedTermsProps = {
  word: string;
  route?: string;
  params?: object;
  model: string;
};

const WordRelatedTerms = (props: WordRelatedTermsProps) => {
  const {
    word,
    route = "most_similar",
    params: baseParams = {},
    model = "trigram_lowered_cleaned",
  } = props;
  const params = {
    word: word.replace(" ", "_"),
    model,
    ...baseParams,
  };

  const res =
    useAPIResult("most_similar", params, { context: Word2VecAPIContext }) ?? [];
  const { buildURL } = useAPIHelpers(Word2VecAPIContext);
  const url = buildURL("most_similar", {
    ...params,
    n: 50,
    // we've hardcoded this; that may need to change
  });

  if (params.word == "") return null;

  return h("div.related-terms-response", [
    h("h4", word),
    h(TermResults, { words: res }),
    h(
      AnchorButton,
      {
        href: url,
        small: true,
        minimal: true,
        rightIcon: "code",
        target: "_blank",
        className: "json-object",
      },
      "JSON"
    ),
  ]);
};

type _ = {
  baseURL?: string;
};

function ModelButton({ model }) {
  return h(
    Button,
    { className: "model-select", minimal: true, small: true },
    h("code.model-name", model)
  );
}

function ModelItem({ model, text, selectedModel, setModel }: any) {
  text ??= h("code", model);
  return h(MenuItem, {
    intent: model == selectedModel ? Intent.SUCCESS : null,
    onClick() {
      setModel(model);
    },
    text,
  });
}

const RelatedTermsCard = (props) => {
  const { isOpen = true, onClose } = props;

  const res = useAPIResult("models", null, { context: Word2VecAPIContext });
  const [modelState, setModel] = useState<string | null>(null);
  if (res == null) return null;
  const models = res?.models ?? [];

  const bestModel = findBestModel(models);

  const model = modelState ?? bestModel;

  if (model == null) return null;

  const words = joinWords(model, props.words);

  const modelMenu = h(Menu, [
    h(ModelItem, {
      setModel,
      model: null,
      text: "Auto",
    }),
    h(MenuDivider),
    models.map((d) =>
      h(ModelItem, {
        model: d.name,
        key: d.name,
        selectedModel: modelState,
        setModel,
      })
    ),
  ]);

  return h(CollapseCard, { isOpen, className: "related-terms" }, [
    h("div.top-row", [
      h("h3", "Related terms"),
      h("div.control.model-control", [
        h("span.label", "Model:"),
        " ",
        h(Popover, [h(ModelButton, { model }), modelMenu]),
      ]),
      h("div.spacer"),
      h(
        "div.right-controls",
        null,
        h(Button, {
          icon: "cross",
          intent: Intent.DANGER,
          minimal: true,
          onClick: onClose,
        })
      ),
    ]),

    h(
      "div.terms",
      words.map((w, i) => h(WordRelatedTerms, { word: w, model, key: i }))
    ),
  ]);
};

export { Word2VecAPIContext, Word2VecAPIProvider, RelatedTermsCard };
