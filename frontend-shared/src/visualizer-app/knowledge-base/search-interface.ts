import h from "@macrostrat/hyper";
import { useState, useEffect } from "react";
import {
  InputGroup,
  Button,
  Position,
  Tooltip,
  Intent,
} from "@blueprintjs/core";
import { Navbar } from "./components";
import { useAppState, useAppDispatch, useTypes } from "./provider";
import { RelatedTermsButton } from "./related-terms";
import { Spec } from "immutability-helper";

function FilterButton() {
  const { filterParams, filterPanelOpen, allowSearch } = useAppState();
  const dispatch = useAppDispatch();
  const types = useTypes();

  const name =
    types.find((d) => d.id == filterParams.type)?.name ?? "All types";

  const setFilterPanelOpen = (value: boolean | undefined) => {
    dispatch({ type: "toggle-filter-panel", value });
  };

  return h(
    Tooltip,
    {
      content: `${filterPanelOpen ? "Hide" : "Show"} filter panel`,
      position: Position.BOTTOM,
    },
    h(
      Button,
      {
        minimal: true,
        intent: !filterPanelOpen ? Intent.PRIMARY : null,
        icon: "filter",
        large: true,
        onClick() {
          setFilterPanelOpen(!filterPanelOpen);
        },
      },
      name
    )
  );
}

interface SearchInterfaceProps {}

const Searchbar = (props: SearchInterfaceProps) => {
  const { filterParams, filterPanelOpen, allowSearch } = useAppState();
  const dispatch = useAppDispatch();

  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    setInputValue(filterParams.query);
  }, [filterParams]);

  const updateFilter = (spec: Spec<FilterParams>) => {
    dispatch({ type: "update-filter", spec });
  };

  const updateQuery = () => updateFilter({ query: { $set: inputValue } });
  const onChange = (event) => setInputValue(event.target.value);

  const searchDisabled = inputValue == filterParams.query || !allowSearch;

  return h("div.search-bar-contents", [
    h(InputGroup, {
      className: "main-search",
      large: true,
      disabled: !allowSearch,
      value: inputValue,
      leftIcon: "search",
      placeholder: "Search extractions",
      onChange,
      onKeyPress: (event) => {
        if (event.key === "Enter") updateQuery();
      },
      rightElement: h("div.right-buttons", [
        h(FilterButton),
        h(Button, {
          icon: "arrow-right",
          disabled: searchDisabled,
          intent: Intent.SUCCESS,
          onClick() {
            updateQuery();
          },
        }),
      ]),
    }),
  ]);
};

const SearchInterface = (props) => {
  const { children } = props;
  const dispatch = useAppDispatch();

  const handleScroll = (event) => {
    dispatch({
      type: "document-scrolled",
      offset: document.scrollingElement.scrollTop,
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
  });

  return h("div.search-interface", [
    h(Navbar, null, [h(Searchbar), h(RelatedTermsButton)]),
    children,
  ]);
};

export { SearchInterface, Navbar };
