import h from "@macrostrat/hyper";
import { useState } from "react";
import {
  Button,
  ButtonGroup,
  Collapse,
  Intent,
  FormGroup,
  ISliderProps,
} from "@blueprintjs/core";
import { CollapseCard } from "~/shared/ui";
import { NullableSlider } from "@macrostrat/ui-components";
import {
  useAppState,
  useAppDispatch,
  useTypes,
  SearchBackend,
  ThresholdKey,
  ESSearchLogic,
} from "./provider";

interface ConfidenceSliderProps extends ISliderProps {
  id: ThresholdKey;
  label: string;
  labelInfo?: string;
}

const ConfidenceSlider = (props: ConfidenceSliderProps) => {
  const { id, label, max: _max, labelInfo, ...rest } = props;
  const { filterParams } = useAppState();
  const dispatch = useAppDispatch();

  const max = _max ?? 1;

  const confProps = {
    min: 0,
    max,
    initialValue: max,
    stepSize: 0.02,
    labelStepSize: 0.2,
    labelPrecision: 2,
  };
  const onRelease = (value: number) =>
    dispatch({ type: "set-threshold", key: id, value });

  const value = filterParams[id];

  return h(
    FormGroup,
    { label, labelInfo, inline: true },
    h(NullableSlider, { ...confProps, ...rest, onRelease, value })
  );
};

const ConfidenceControls = (props) => {
  return h("div.slider-panel", [
    h(ConfidenceSlider, {
      id: "base_confidence",
      label: "Base confidence",
    }),
    h(ConfidenceSlider, {
      id: "postprocessing_confidence",
      label: "Post confidence",
    }),
    h(ConfidenceSlider, {
      id: "area",
      label: "Area",
      labelInfo: "(px²)",
      min: 30000,
      max: 100000,
      stepSize: 10000,
      labelStepSize: 30000,
      labelRenderer: (v) => `${v / 1000}k`,
    }),
  ]);
};

const TypeSelector = (props) => {
  const types = useTypes();
  const dispatch = useAppDispatch();
  const { filterParams } = useAppState();
  const filterType = filterParams.type;

  const setFilterType = (cls: FeatureType | null) => () => {
    if (filterType == cls?.id) return;
    dispatch({ type: "set-filter-type", featureType: cls });
  };

  return h("div.type-selector", [
    h("h3", "Extraction type"),
    h("div.filter-types", [
      h(
        ButtonGroup,
        [...types, null].map((d) =>
          h(
            Button,
            {
              intent: filterType == d?.id ? Intent.PRIMARY : null,
              onClick: setFilterType(d),
            },
            d?.name ?? "All"
          )
        )
      ),
    ]),
  ]);
};

const useSearchLogic = (): ESSearchLogic | null => {
  const { filterParams, searchBackend } = useAppState();
  if (searchBackend == SearchBackend.Anserini) return null;
  console.log(filterParams);
  return filterParams?.search_logic == "any"
    ? ESSearchLogic.Any
    : ESSearchLogic.All;
};

const SearchBackendDetails = () => {
  const { searchBackend } = useAppState();
  const dispatch = useAppDispatch();
  const searchLogic = useSearchLogic();

  if (searchBackend != SearchBackend.ElasticSearch) {
    return null;
  }

  return h("div.es-backend-details", [
    h("p", "Search phrases are separated with commas."),
    h(
      FormGroup,
      { label: "Match terms", inline: true },
      h(ButtonGroup, [
        h(
          Button,
          {
            small: true,
            onClick() {
              dispatch({
                type: "set-es-search-logic",
                value: ESSearchLogic.All,
              });
            },
            intent: searchLogic == ESSearchLogic.All ? Intent.PRIMARY : null,
          },
          "All"
        ),
        h(
          Button,
          {
            small: true,
            onClick() {
              dispatch({
                type: "set-es-search-logic",
                value: ESSearchLogic.Any,
              });
            },
            intent: searchLogic == ESSearchLogic.Any ? Intent.PRIMARY : null,
          },
          "Any"
        ),
      ])
    ),
  ]);
};

const SearchBackendSelector = () => {
  const { searchBackend } = useAppState();
  const dispatch = useAppDispatch();

  const propsFor = (backend: SearchBackend) => ({
    intent: searchBackend == backend ? Intent.PRIMARY : null,
    onClick() {
      if (backend == searchBackend) return;
      dispatch({ type: "set-search-backend", backend });
    },
    children: backend,
    small: true,
  });

  return h("div.search-backend-selector", [
    h(
      FormGroup,
      { label: h("h4", "Backend") },
      h(ButtonGroup, [
        h(Button, propsFor(SearchBackend.Anserini)),
        h(Button, propsFor(SearchBackend.ElasticSearch)),
      ])
    ),
    h(SearchBackendDetails),
  ]);
};

const FilterPanel = (props) => {
  const { filterPanelOpen } = useAppState();
  const dispatch = useAppDispatch();

  const [detailsExpanded, expandDetails] = useState(false);

  return h(
    CollapseCard,
    { isOpen: filterPanelOpen, className: "filter-controls bp3-text" },
    [
      h("div.top-row", [
        h(TypeSelector),
        h("div.spacer"),
        h(
          "div.right-controls",
          null,
          h(ButtonGroup, { minimal: true }, [
            h(
              Button,
              {
                intent: !detailsExpanded ? Intent.PRIMARY : null,
                rightIcon: !detailsExpanded ? "caret-down" : "caret-up",
                onClick() {
                  expandDetails(!detailsExpanded);
                },
              },
              detailsExpanded ? "Hide details" : "Show details"
            ),
            h(Button, {
              icon: "cross",
              intent: Intent.DANGER,
              onClick() {
                dispatch({ type: "toggle-filter-panel", value: false });
              },
            }),
          ])
        ),
      ]),
      h(Collapse, { className: "search-details", isOpen: detailsExpanded }, [
        h("div.threshold-controls", [
          h("h4", "Thresholds"),
          h(ConfidenceControls),
        ]),
        h(SearchBackendSelector),
      ]),
    ]
  );
};

export { FilterPanel };
