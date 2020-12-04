import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";
import chroma, { Color } from "chroma-js";
import { useAPIResult } from "@macrostrat/ui-components";
import { Tag } from "./types";

const TagsContext = createContext<Tag[]>([]);
type TagsProviderProps = React.PropsWithChildren<{ tags: Tag[] }>;

const TagsProvider = (props: TagsProviderProps) => {
  /**
  Provides the ability to select an annotation
  */
  const { children, tags } = props;

  return h(TagsContext.Provider, { value: tags }, children);
};

const useTags = (): Tag[] => useContext(TagsContext);

function tagColor(tag?: Tag): Color {
  return chroma(tag?.color ?? "black");
}

function useTagColor(tag_id: string): Color {
  const tags = useTags();
  return tagColor(tags.find((d) => d.tag_id === tag_id));
}

function useTagColorForName(tag_name: string): Color {
  const tags = useTags();
  return tagColor(tags.find((d) => d.name === tag_name));
}

const parseResponse = (cscale) => (d, ix) => {
  let { tag_id, color, name } = d;

  if (name == null) {
    name = tag_id.replace("-", " ");
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  if (color == null) {
    color = cscale[ix];
  }
  return { tag_id, color, name };
};

function TagListProvider({ children, tags }) {
  const cscale = chroma.scale("viridis").colors(tags.length);
  return h(
    TagsProvider,
    {
      tags: tags.map(parseResponse(cscale)),
    },
    children
  );
}

const APITagsProvider = ({ children }) => {
  const tags = useAPIResult("/tags/all") ?? [];
  return h(TagListProvider, { tags }, children);
};

export {
  TagsContext,
  TagsProvider,
  TagListProvider,
  APITagsProvider,
  tagColor,
  useTags,
  useTagColor,
  useTagColorForName,
};
