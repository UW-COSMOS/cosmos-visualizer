import h from 'react-hyperscript';
import {Button, Intent} from '@blueprintjs/core'

const defaultProps = {
  allowSaveWithoutChanges: true,
  hasInitialContent: false
}
type PersistenceButtonProps = {
  hasChanges: boolean,
  onSave(): void,
  onClearChanges(): void
} & typeof defaultProps

const PersistenceButtons = (props: PersistenceButtonProps)=>{
  // Persist data to backend if editing is enabled
  const {
    allowSaveWithoutChanges,
    hasChanges,
    onClearChanges,
    onSave,
    hasInitialContent
  } = props;
  let clearRectText = "Clear changes";
  if (hasInitialContent) {
    clearRectText = "Reset changes";
  }
  return h([
    h(Button, {
      intent: Intent.SUCCESS, text: "Save",
      icon: 'floppy-disk',
      onClick: onSave,
      disabled: !hasChanges && !allowSaveWithoutChanges
    }),
    h(Button, {
      intent: Intent.DANGER, text: clearRectText,
      icon: 'trash', disabled: !hasChanges,
      onClick: onClearChanges
    })
  ]);
}

PersistenceButtons.defaultProps = defaultProps

export {PersistenceButtons, PersistenceButtonProps}
