import { useContext } from "react";
import h from "@macrostrat/hyper";
import { Button, Intent } from "@blueprintjs/core";
import classNames from "classnames";

import { EditMode } from "~/enum";
import { EditorContext } from "~/image-overlay/context";
import { useCallback } from "react";
import {
  useCanvasSize,
  useAnnotations,
  useAnnotationActions,
} from "~/providers";

const ToolButton = (props) =>
  h(Button, { small: true, minimal: true, ...props });

const LinkButton = (props) => {
  const { update } = props;
  const {
    actions: { setMode },
    editModes,
  } = useContext(EditorContext);
  const removeLink = useCallback(
    () => update({ linked_to: { $set: null } }),
    []
  );

  if (props.linked_to != null) {
    return h(ToolButton, {
      icon: "ungroup-objects",
      onClick: removeLink,
    });
  }
  return h(ToolButton, {
    icon: "new-link",
    intent: editModes.has(EditMode.LINK) ? Intent.SUCCESS : undefined,
    onClick() {
      return setMode(EditMode.LINK);
    },
  });
};

interface AnnotationControlsProps {
  annotation: Annotation;
  annotationIndex: number;
  className?: string;
  children?: React.ReactNode;
}

const ControlPanel = (props: AnnotationControlsProps) => {
  const { children, className } = props;
  // Make sure clicks on the control panel don't dismiss it
  // due to the competing overlay click handler
  const onClick = useCallback((event) => event.stopPropagation(), []);
  const onMouseOver = onClick;
  const style = { pointerEvents: "visible" };
  return h(
    "div.rect-controls",
    { className, onClick, onMouseOver, style },
    children
  );
};

interface AnnotationLeftControlProps extends AnnotationControlsProps {
  annotation: Annotation;
}

const LeftControlPanel = (props: AnnotationLeftControlProps) => {
  const { children, annotation } = props;
  const { boxes } = annotation;

  // Calculate editing menu position
  const { height, scaleFactor } = useCanvasSize();
  const maxY = boxes[0][3] / scaleFactor;
  const cls = maxY > height - 50 ? "top" : "bottom";
  const className = classNames(cls, props.className);
  return h(ControlPanel, { className }, children);
};

const AnnotationControls = (props: AnnotationControlsProps) => {
  const { annotationIndex: ix } = props;

  const { deleteAnnotation, updateAnnotation } = useAnnotationActions()!;
  const annotation = useAnnotations()[ix];
  const { linked_to } = annotation;

  const update = useCallback(updateAnnotation(ix), [ix]);

  const {
    actions: { setMode, toggleSelect },
    editModes,
  } = useContext(EditorContext);

  const onClickDelete = useCallback(() => deleteAnnotation(ix), [
    deleteAnnotation,
    ix,
  ]);

  if (update == null) return null;

  return h(LeftControlPanel, { annotation }, [
    h(ToolButton, {
      icon: "tag",
      onClick: toggleSelect,
    }),
    h(LinkButton, { update, linked_to }),
    h(ToolButton, {
      icon: "insert",
      intent: editModes.has(EditMode.ADD_PART) ? Intent.SUCCESS : undefined,
      onClick() {
        setMode(EditMode.ADD_PART);
      },
    }),
    h(ToolButton, {
      icon: "cross",
      intent: Intent.DANGER,
      onClick: onClickDelete,
    }),
  ]);
};

export { ToolButton, ControlPanel, AnnotationControls };
