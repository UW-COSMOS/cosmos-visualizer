import h from '@macrostrat/hyper';
import {Navbar, Button, ButtonGroup,
        Intent, Alignment} from "@blueprintjs/core";

import {useState, ComponentProps, ReactNode} from 'react'
import {PermalinkButton} from '../permalinks';
import {PageHeader} from '../util';
import {InfoDialog} from '../info-dialog';
import {PersistenceButtons} from './persistence-buttons'
import {Image} from '~/types'
import {useAnnotationEditor} from '~/providers'

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
    navigationEnabled,
    getNextImage,
    children
  } = props;

  const [dialogIsOpen, setDialogOpen] = useState(false)

  const ctx = useAnnotationEditor()
  const editingEnabled = (ctx != null)
  const hasChanges = ctx?.hasChanges ?? false

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
          h(PersistenceButtons),
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
