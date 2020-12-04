import { useContext, useCallback } from "react";
import h from "@macrostrat/hyper";
import { min, max } from "d3-array";
import { Intent } from "@blueprintjs/core";
import classNames from "classnames";

import { Rectangle, StaticRectangle } from "./drag-rect";
import { AnnotationControls, ToolButton } from "./controls";
import {
  useTags,
  tagColor,
  useAnnotationColor,
  useAnnotationActions,
  useSelectedAnnotation,
  useSelectionUpdater,
  AnnotationsContext,
  useAnnotationEditor,
  Annotation as IAnnotation,
} from "~/providers";

const tagBounds = (boxes) => [
  min(boxes, (d) => d[0]),
  min(boxes, (d) => d[1]),
  max(boxes, (d) => d[2]),
  max(boxes, (d) => d[3]),
];

const tagCenter = function (boxes) {
  const d = tagBounds(boxes);
  return [(d[0] + d[2]) / 2, (d[1] + d[3]) / 2];
};

const AnnotationPart = (props) => {
  const { isSelected = true, update, onDelete, bounds, color, ...rest } = props;

  return h(Rectangle, { bounds, update, color, ...rest }, [
    h.if(isSelected && onDelete != null)(ToolButton, {
      icon: "cross",
      className: "delete-rect",
      intent: Intent.DANGER,
      onClick: onDelete,
    }),
  ]);
};

function annotationPartUpdater(update, ix) {
  /* Returns an updater function for a particular
     annotation subpart
  */
  if (update == null) {
    return null;
  }
  // Return an updater function
  return (spec) => {
    const { bounds: subSpec } = spec;
    if (subSpec == null) {
      return;
    }
    return update({ boxes: { [ix]: subSpec } });
  };
}

interface AnnotationProps {
  obj: IAnnotation;
  children: React.ReactChild;
  multipartEditingEnabled: boolean;
  locked?: boolean;
  index: number;
}

const Annotation = (props: AnnotationProps) => {
  const { obj, index, multipartEditingEnabled = true, locked = null } = props;
  const { boxes, name: tag_name, tag_id } = obj;

  const { lockedTags } = useAnnotationEditor();
  const { selected } = useContext(AnnotationsContext);
  const { selectAnnotation, updateAnnotation } = useAnnotationActions()!;
  /* This could be simplified significantly;
     we rely on indexing to tell if we have the same annotations
  */
  let update = useCallback(
    (spec) => {
      updateAnnotation(index)(spec);
    },
    [index]
  );
  const isSelected = index == selected;
  if (!isSelected) update = null;
  const overallBounds = tagBounds(boxes);

  let alpha = isSelected ? 0.6 : 0.3;
  const tags = useTags();
  const currentTag = tags.find((d) => d.tag_id === tag_id);
  const c = tagColor(currentTag);
  const color = c.alpha(alpha).css();
  let tagName = currentTag.name ?? tag_name;
  let tagIsLocked = locked ?? lockedTags.has(tag_id);

  // Sometimes we don't return tags

  const onMouseDown = useCallback(
    (event) => {
      selectAnnotation(index);
      event.stopPropagation();
    },
    [index]
  );

  if (tagIsLocked) {
    return h(LockedAnnotation, { obj, index });
  }

  const className = classNames({ active: isSelected });
  const editingEnabled = boxes.length > 1 ? multipartEditingEnabled : false;

  return h("div.annotation", { className }, [
    h(
      StaticRectangle,
      {
        bounds: overallBounds,
        color,
        backgroundColor: "none",
        style: { pointerEvents: "none" },
      },
      [
        h("div.tag-name", { style: { color: c.darken(2).css() } }, tagName),
        h.if(isSelected)(AnnotationControls, {
          annotationIndex: index,
          annotation: obj,
        }),
      ]
    ),
    h(
      "div.tag",
      { className },
      boxes.map((bounds, i) => {
        // Need actual logic here to allow display if editing is enabled
        const deletionCallback = () => update({ boxes: { $splice: [[i, 1]] } });

        return h(AnnotationPart, {
          bounds,
          isSelected,
          update: annotationPartUpdater(update, i),
          onDelete: editingEnabled ? deletionCallback : null,
          onMouseDown,
          color,
        });
      })
    ),
  ]);
};

// TODO: Not sure where this belongs
// setTag(tag){
//   const {update} = this.props;
//   console.log(tag);
//   return update({tag_id: {$set: tag.tag_id}});
// }

const LockedAnnotation = (props: AnnotationProps) => {
  const { obj } = props;
  const { tag_id, boxes } = obj;

  const c = useAnnotationColor(obj);
  const alpha = 0.2;
  const color = c.alpha(alpha).css();

  return h(
    "div.annotation.locked",
    boxes.map((bounds, i) => {
      return h(Rectangle, {
        bounds,
        color,
      });
    })
  );
};

interface BasicAnnotationProps extends AnnotationProps {
  alpha?: number;
  onClick?: React.UIEventHandler;
  onMouseOver?: React.UIEventHandler;
  onMouseLeave?: React.UIEventHandler;
  className?: string;
  index: number;
  obj: IAnnotation;
}

const BasicAnnotation = (props: BasicAnnotationProps) => {
  const { obj, children, alpha, className, ...rest } = props;
  const { name, boxes, score } = obj;

  const c = useAnnotationColor(obj);
  const color = c.alpha(alpha ?? 0.5).css();

  let tagName = name;
  if (score != null) tagName += `(${score})`;

  return h(
    "div.annotation",
    { className },
    boxes.map((bounds, i) => {
      return h(
        StaticRectangle,
        {
          bounds,
          color,
          ...rest,
        },
        [
          h("div.tag-name", { style: { color: c.darken(2).css() } }, tagName),
          children,
        ]
      );
    })
  );
};

const SelectableAnnotation = (props: AnnotationProps) => {
  const selected = useSelectedAnnotation();
  const isSelected = selected == props.obj;
  const updateSelection = useSelectionUpdater();

  return h(BasicAnnotation, {
    ...props,
    alpha: isSelected ? 0.6 : 0.3,
    onClick: (event) => {
      updateSelection(props.obj);
      event.stopPropagation();
    },
  });
};

const SimpleAnnotation = BasicAnnotation;

export {
  SimpleAnnotation,
  SelectableAnnotation,
  Annotation,
  AnnotationProps,
  LockedAnnotation,
  tagCenter,
  tagBounds,
};
