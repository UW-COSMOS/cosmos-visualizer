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
      Rect = if ix == editingRect then DragRectangle else Rectangle
      h Rect, {
        key: ix
        updateRect: actions.updateRectangle(ix)
        onClick: actions.selectRectangle(ix)
        d...
        color: 'rgba(255,0,0,0.5)'
        maxPosition: {width, height}
      }

  render: ->
    {width, height, rest...} = @props
    style = {width, height}
    onClick = @startCreatingRectangle
    h 'div.overlay', {style, onClick}, @renderRectangles()


  handleDrag: =>
    {subject} = event
    {x,y} = subject
    width = event.x-x
    height = event.y-y
    rect = {x,y,width,height, color: 'rgba(255,0,0,0.5)'}
    @setState {inProgressRectangle: rect}

  componentDidMount: ->
    el = select findDOMNode @

    edgeDrag = drag()
      .on "drag", @handleDrag

    el.call edgeDrag



export {Overlay}
