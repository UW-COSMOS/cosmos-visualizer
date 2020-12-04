import { hyperStyled } from "@macrostrat/hyper";
import classNames from "classnames";
import { Button } from "@blueprintjs/core";
import {
  Omnibar,
  IOmnibarProps,
  IItemListRendererProps,
} from "@blueprintjs/select";
import { useCallback } from "react";
import { useTags, useAnnotationEditor } from "~/providers";
import Fuse from "fuse.js";
import chroma from "chroma-js";
import styles from "./main.styl";
import { Tag, TagID } from "~/providers/tags";
const h = hyperStyled(styles);

interface TagItemProps {
  selected: boolean;
  active: boolean;
  className?: string;
  tag: Tag;
  onSelect(t: Tag): void;
  children?: React.ReactElement;
}

const TagListItem: React.ComponentType<TagItemProps> = (props) => {
  /** Render a tag for the omnibox list */
  let { active, selected, className, onSelect, tag, children } = props;
  className = classNames({ active, selected }, className);
  const color = chroma(tag.color);
  const light = color.set("hsl.l", selected ? 0.5 : 0.95);
  const dark = color.set("hsl.l", selected ? 0.95 : 0.5);

  const onClick = () => onSelect(tag);

  return h(
    "div.tag-item-container",
    {
      key: tag.tag_id,
      className,
      onClick,
      style: { backgroundColor: light.css(), color: dark.css() },
    },
    [h("div.tag-item", {}, tag.name), children]
  );
};

type BoxLifecycleProps = Pick<IOmnibarProps<Tag>, "onClose" | "isOpen">;
interface OmniboxProps extends BoxLifecycleProps {
  selectedTag: Tag;
  onSelectTag: (t: Tag) => void;
  updateCurrentTag: (t: TagID, selected: boolean) => void;
  currentTag: TagID;
  listItemComponent?: React.ComponentType<TagItemProps>;
}

const AnnotationTypeOmnibox = (props: OmniboxProps) => {
  /** A general omnibox for annotation types */
  const {
    onSelectTag,
    listItemComponent,
    currentTag,
    updateCurrentTag,
    isOpen,
    onClose,
  } = props;
  const tags = useTags();

  const options = {
    shouldSort: true,
    minMatchCharLength: 0,
    keys: ["name", "description"],
  };

  let fuse = null;

  const onSelect = useCallback(
    (tag: Tag) => {
      updateCurrentTag(tag.tag_id, true);
      onClose();
    },
    [updateCurrentTag, onClose]
  );

  const itemListRenderer = useCallback(
    (props: IItemListRendererProps<Tag>) => {
      const { filteredItems, activeItem } = props;
      return h(
        "div.item-list",
        null,
        filteredItems.map((tag: Tag) => {
          const selected = tag.tag_id === currentTag;
          return h(listItemComponent, {
            selected,
            active: tag == activeItem,
            onSelect,
            tag,
          });
        })
      );
    },
    [currentTag]
  );

  return h<Tag>(Omnibar, {
    onItemSelect: onSelect,
    items: tags,
    resetOnSelect: true,
    isOpen,
    onClose,
    itemListRenderer,
    itemListPredicate(query, items) {
      if (query == null || query === "") {
        return items;
      }
      if (fuse == null) {
        fuse = new Fuse(items, options);
      }
      return fuse.search(query);
    },
  });
};

AnnotationTypeOmnibox.defaultProps = {
  listItemComponent: TagListItem,
};

interface LockableItemProps extends TagItemProps {
  toggleLock(v: Tag): void;
  locked: boolean;
}

const LockableListItem = (props: LockableItemProps) => {
  let { tag, ...rest } = props;

  const ctx = useAnnotationEditor()!;
  const { lockedTags } = ctx;
  const { toggleTagLock } = ctx.actions!;
  const toggleLock = toggleTagLock(tag.tag_id);
  const locked = lockedTags.has(tag.tag_id);

  const icon = locked ? "lock" : "unlock";

  return h(
    TagListItem,
    { tag, ...rest },
    h(Button, {
      minimal: true,
      icon,
      small: true,
      onClick(event: React.MouseEvent) {
        toggleLock();
        event.stopPropagation();
      },
    })
  );
};

LockableListItem.defaultProps = { locked: false };

const AnnotationTypeSelector = (props) => {
  const { currentTag, actions } = useAnnotationEditor();
  const { updateCurrentTag } = actions;
  /** A lockable annotation type selector (first output, for tagging app) */
  return h(AnnotationTypeOmnibox, {
    ...props,
    currentTag,
    updateCurrentTag,
    listItemComponent: LockableListItem,
  });
};

export { AnnotationTypeSelector, AnnotationTypeOmnibox };
