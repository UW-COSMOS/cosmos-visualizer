import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {Dialog, Button, ButtonGroup
        Intent, Alignment, Text, Icon,
        Classes, Callout } from "@blueprintjs/core"

class InfoDialog extends Component
  render: ->
    h Dialog, {@props...}, [
      h 'div', {className: Classes.DIALOG_BODY}, [
        h 'h3.bp3-heading', "COSMOS Image Tagger"
        h 'h4', "Usage info"
        @renderAdmonition()
        @renderInstructions()
        h 'h4', 'Credits'
        h 'ul', [
          h 'li', "Frontend: Daven Quinn"
          h 'li', "Backend: Ian Ross, Daven Quinn, John Czaplewski"
        ]
      ]
      @renderActions()
    ]
  renderAdmonition: =>
    {editingEnabled} = @props
    return null if editingEnabled
    h Callout, {title: "Saving disabled", intent: Intent.WARNING}, (
      "The application has been initialized for viewing only"
    )

  renderInstructions: =>
    return h 'div.instructions', [
      h 'ul.bp3-text', [
        h 'li', "Click + drag to create item."
        h 'li', "Click existing item to adjust."
      ]
    ]

  renderActions: =>
    h 'div', {className: Classes.DIALOG_FOOTER}, [
      h Button, {
        onClick: @props.displayKeyboardShortcuts
      }, "Display keyboard shortcuts"
    ]

export {InfoDialog}
