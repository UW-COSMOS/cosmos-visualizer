import h from "react-hyperscript";
import { Button, Intent } from "@blueprintjs/core";
import { useAnnotationEditor } from "~/providers";

type PersistenceButtonProps = {
  allowSaveWithoutChanges: boolean;
};

const PersistenceButtons = (props: PersistenceButtonProps) => {
  // Persist data to backend if editing is enabled
  const ctx = useAnnotationEditor();
  if (ctx == null) return null;

  const { hasChanges, initialAnnotations } = ctx;
  const { allowSaveWithoutChanges = false } = props;
  let clearRectText = "Clear changes";
  if (initialAnnotations.length > 0) {
    clearRectText = "Reset changes";
  }

  const { saveChanges, clearChanges } = ctx.editorActions;

  return h([
    h(Button, {
      intent: Intent.SUCCESS,
      text: "Save",
      icon: "floppy-disk",
      onClick: saveChanges,
      disabled: !hasChanges && !allowSaveWithoutChanges,
    }),
    h(Button, {
      intent: Intent.DANGER,
      text: clearRectText,
      icon: "trash",
      disabled: !hasChanges,
      onClick: clearChanges,
    }),
  ]);
};

export { PersistenceButtons, PersistenceButtonProps };
