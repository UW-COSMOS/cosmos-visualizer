import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {Dialog, Button, ButtonGroup
        Intent, Alignment, Text, Icon,
        Classes, Callout } from "@blueprintjs/core"

class InfoDialog extends Component
  render: ->
    h Dialog, {@props...}, [
      h 'div', {className: Classes.DIALOG_BODY}, [
        h 'h4.bp3-heading', "Usage info"
        @renderAdmonition()
        @renderInstructions()
      ]
      @renderActions()
    ]
  renderAdmonition: =>
    {editingEnabled} = @props
    return null if editingEnabled
    h Callout, {title: "Saving disabled", intent: Intent.WARNING}, (
      "The application has been initialized in a mode for
       viewing only"
    )

  renderInstructions: =>
    text = "Click + drag to create item. Click existing item to adjust."
    return h 'div.instructions', [
      h(Text, text)
    ]

  renderActions: =>
    h 'div', {className: Classes.DIALOG_FOOTER}, [
      h Button, {
        onClick: @props.displayKeyboardShortcuts
      }, "Display keyboard shortcuts"
    ]

export {InfoDialog}
