import {Component} from 'react'
import h from 'react-hyperscript'
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {findDOMNode} from 'react-dom'
import { Hotkey, Hotkeys, HotkeysTarget } from "@blueprintjs/core"
import {Tag, ActiveTag} from './annotation'

class Overlay extends Component
  @defaultProps: {
    # Distance we take as a click before switching to drag
    clickDistance: 10
    editingEnabled: true
  }
  constructor: (props)->
    super props
    @state = {
      inProgressAnnotation: null
    }

  renderAnnotations: ->
    {inProgressAnnotation} = @state
    {image_tags, tags, width, height,
     editingRect, actions, scaleFactor} = @props

    if inProgressAnnotation?
      editingRect = null
      image_tags = [image_tags..., inProgressAnnotation]

    image_tags.map (d, ix)=>
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
        return h ActiveTag, {
          delete: actions.deleteAnnotation(ix)
          update: actions.updateAnnotation(ix)
          opts...
        }
      return h Tag, {
        onClick: actions.selectAnnotation(ix)
        opts...
      }

  render: ->
    {width, height, rest...} = @props
    style = {width, height}
    onClick = @disableEditing
    h 'div.overlay', {style, onClick}, @renderAnnotations()

  handleDrag: =>
    {subject} = event
    {x,y} = subject
    {clickDistance, currentTag, scaleFactor, editingEnabled} = @props
    console.log "Started dragging"
    return if not editingEnabled
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
    boxes = [[x,y,x+width,y+height]]
    rect = {boxes, tag_id: currentTag}
    @setState {inProgressAnnotation: rect}

  handleAddAnnotation: =>
    {actions} = @props
    {inProgressAnnotation: r} = @state
    @setState {inProgressAnnotation: null}
    actions.appendAnnotation r

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
        onKeyDown: (evt)=>
          actions.deleteAnnotation(editingRect)()
          evt.preventDefault()
      }
    ]

  componentDidMount: ->
    el = select findDOMNode @

    # Set up dragging when rectangle is not clicked
    @edgeDrag = drag()
      .on "drag", @handleDrag
      .on "end", @handleAddAnnotation
      .clickDistance @props.clickDistance

    el.call @edgeDrag

Overlay = HotkeysTarget(Overlay)

export {Overlay}
