import h from '@macrostrat/hyper';
import {Navbar, Button, ButtonGroup,
        Intent, Alignment} from "@blueprintjs/core";

import {useState, ComponentProps, ReactNode} from 'react'
import {PermalinkButton} from '../permalinks';
import {PageHeader} from '../util';
import {InfoDialog} from '../info-dialog';
import {PersistenceButtons} from './persistence-buttons'
import {Image} from '~/types'

interface FrameProps extends
  ComponentProps<typeof PersistenceButtons> {
  getNextImage(): void,
  currentImage: Image,
  subtitleText?: string,
  editingEnabled?: boolean,
  navigationEnabled?: boolean
}

const sendKey = (k: number, opts={}): void => document.dispatchEvent(
  new KeyboardEvent('keydown', {which: k, keyCode: k, ...opts, bubbles: true }));

const PageFrame = (props: FrameProps)=>{
  const {
    subtitleText,
    currentImage: image,
    children,
    hasChanges,
    editingEnabled,
    navigationEnabled,
    hasInitialContent,
    onSave,
    onClearChanges,
    getNextImage
  } = props;

  const [dialogIsOpen, setDialogOpen] = useState(false)

  return h('div.main', [
    h(Navbar, {fixedToTop: true}, [
      h(PageHeader, {subtitle: subtitleText}, [
        h(Button, {
          icon: 'info-sign',
          onClick: ()=>setDialogOpen(!dialogIsOpen)
        }, "Usage")
      ]),
      h(Navbar.Group, {align: Alignment.RIGHT}, [
        h(PermalinkButton, {image}),
        h(ButtonGroup, [
          h.if(editingEnabled)(PersistenceButtons, {
            hasChanges,
            hasInitialContent,
            onClearChanges,
            onSave
          }),
          h.if(navigationEnabled)(Button, {
            intent: Intent.PRIMARY,
            text: "Next image",
            rightIcon: 'chevron-right',
            disabled: hasChanges,
            onClick: getNextImage
          })
        ])
      ])
    ]),
    children,
    h(InfoDialog, {
      isOpen: dialogIsOpen,
      onClose() { setDialogOpen(false) },
      editingEnabled,
      displayKeyboardShortcuts() {
        setDialogOpen(false)
        sendKey(47, {shiftKey: true})
      }
    })
  ]);
}

PageFrame.defaultProps = {
  navigationEnabled: true,
  editingEnabled: false,
  subtitleText: "Page viewer"
}

export {PageFrame}
