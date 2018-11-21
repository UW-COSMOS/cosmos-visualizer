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
    {rectangles, tags, width, height,
     editingRect, actions, scaleFactor} = @props

    if inProgressRectangle?
      editingRect = null
      rectangles = [rectangles..., inProgressRectangle]

    rectangles.map (d, ix)=>
      _editing = ix == editingRect
      opacity = if _editing then 0.5 else 0.3

      opts = {
        key: ix
        d...
        tags
        scaleFactor
        maxPosition: {width, height}
      }

      if _editing
        return h DragRectangle, {
          delete: actions.deleteRectangle(ix)
          update: actions.updateRectangle(ix)
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
    {clickDistance, currentTag, scaleFactor} = @props
    scaleFactor ?= 1
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
    # Shift to image coordinates from pixel coordinates
    x *= scaleFactor
    y *= scaleFactor
    width *= scaleFactor
    height *= scaleFactor
    rect = {x,y,width,height, tag_id: currentTag}
    @setState {inProgressRectangle: rect}

  handleAddRectangle: =>
    {actions} = @props
    {inProgressRectangle: r} = @state
    @setState {inProgressRectangle: null}
    actions.appendRectangle r

  disableEditing: =>
    {actions,editingRect} = @props
    if editingRect?
      __ = {editingRect: {$set: null}}
      actions.updateState __

  renderHotkeys: ->
    {editingRect, actions} = @props
    h Hotkeys, null, [
      h Hotkey, {
        label: "Delete rectangle"
        combo: "backspace"
        global: true
        disabled: not editingRect?
        onKeyDown: actions.deleteRectangle(editingRect)
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
