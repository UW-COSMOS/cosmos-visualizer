import {Component} from 'react'
import h from 'react-hyperscript'
import {DragRectangle, Rectangle} from './drag-rect'
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {findDOMNode} from 'react-dom'

class Overlay extends Component
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
      Rect = if _editing then DragRectangle else Rectangle
      opacity = if _editing then 0.5 else 0.3
      h Rect, {
        key: ix
        updateRect: actions.updateRectangle(ix)
        onClick: actions.selectRectangle(ix)
        d...
        color: "rgba(255,0,0,#{opacity})"
        maxPosition: {width, height}
      }

  render: ->
    {width, height, rest...} = @props
    style = {width, height}
    onClick = @disableEditing
    h 'div.overlay', {style, onClick}, @renderRectangles()

  handleDrag: =>
    {subject} = event
    {x,y} = subject
    width = event.x-x
    height = event.y-y
    rect = {x,y,width,height}
    @setState {inProgressRectangle: rect}

  handleAddRectangle: =>
    {actions} = @props
    actions.addRectangle @state.inProgressRectangle
    @setState {inProgressRectangle: null}

  disableEditing: =>
    {actions,editingRect} = @props
    if editingRect?
      __ = {editingRect: {$set: null}}
      actions.updateState __

  componentDidMount: ->
    el = select findDOMNode @

    @edgeDrag = drag()
      .on "drag", @handleDrag
      .on "end", @handleAddRectangle
      .filter => not @props.editingRect?

    el.call @edgeDrag

export {Overlay}
