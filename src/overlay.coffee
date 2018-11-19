import {Component} from 'react'
import h from 'react-hyperscript'
import {DragRectangle, Rectangle} from './drag-rect'
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {findDOMNode} from 'react-dom'
import { Hotkey, Hotkeys, HotkeysTarget } from "@blueprintjs/core"


class Overlay extends Component
  @defaultProps: {
    # Distance we take as a click before switching to drag
    clickDistance: 10
  }
  constructor: (props)->
    super props
    @state = {
      inProgressRectangle: null
    }

  renderRectangles: ->
    {inProgressRectangle} = @state
    {rectangles, width, height, editingRect, actions} = @props
    if inProgressRectangle?
      editingRect = null
      rectangles = [rectangles..., inProgressRectangle]

    rectangles.map (d, ix)=>
      _editing = ix == editingRect
      opacity = if _editing then 0.5 else 0.3
      opts = {
        key: ix
        d...
        color: "rgba(255,0,0,#{opacity})"
        maxPosition: {width, height}
      }

      if _editing
        return h DragRectangle, {
          delete: actions.deleteRectangle(ix)
          update: actions.updateRectangle(ix)
          #changeTag: actions.changeClass(ix)
          currentTag: null
          opts...
        }
      return h Rectangle, {
        onClick: actions.selectRectangle(ix)
        opts...
      }

  render: ->
    {width, height, rest...} = @props
    style = {width, height}
    onClick = @disableEditing
    h 'div.overlay', {style, onClick}, @renderRectangles()

  handleDrag: =>
    {subject} = event
    {x,y} = subject
    {clickDistance} = @props
    width = event.x-x
    height = event.y-y
    if width < 0
      width *= -1
      x -= width
    if height < 0
      height *= -1
      y -= height
    return if width < clickDistance
    return if height < clickDistance
    rect = {x,y,width,height}
    @setState {inProgressRectangle: rect}

  handleDeleteRectangle: =>
    console.log "Deleting rect"
    {actions, editingRect} = @props
    return unless editingRect?
    actions.updateState {
      rectStore: {$splice: [[editingRect,1]]}
      editingRect: {$set: null}
    }

  handleAddRectangle: =>
    {actions} = @props
    {inProgressRectangle: r} = @state
    @setState {inProgressRectangle: null}

    return unless r?
    actions.appendRectangle r
    l = @props.rectangles.length
    actions.updateState {editingRect: {$set: l-1}}

  disableEditing: =>
    {actions,editingRect} = @props
    if editingRect?
      __ = {editingRect: {$set: null}}
      actions.updateState __

  renderHotkeys: ->
    {editingRect} = @props
    h Hotkeys, null, [
      h Hotkey, {
        label: "Delete rectangle"
        combo: "backspace"
        global: true
        disabled: not editingRect?
        onKeyDown: @handleDeleteRectangle
      }
    ]

  componentDidMount: ->
    el = select findDOMNode @

    @edgeDrag = drag()
      .on "drag", @handleDrag
      .on "end", @handleAddRectangle
      .clickDistance @props.clickDistance
      .filter => not @props.editingRect?

    el.call @edgeDrag

Overlay = HotkeysTarget(Overlay)

export {Overlay}
