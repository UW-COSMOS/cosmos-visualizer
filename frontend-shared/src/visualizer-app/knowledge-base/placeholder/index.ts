import h from "@macrostrat/hyper";
import { NonIdealState, INonIdealStateProps } from "@blueprintjs/core";

interface PlaceholderProps extends INonIdealStateProps {
  loading: boolean;
}

const Placeholder = (props: PlaceholderProps) => {
  const { loading, ...rest } = props;

  return h("div.placeholder", [
    h(NonIdealState, {
      icon: "search-template",
      className: "placeholder-inner",
      title: "No results yet",
      description: "Enter a query to search the knowledge base",
      ...rest,
    }),
  ]);
};

Placeholder.defaultProps = {
  loading: false,
};

export { Placeholder };
