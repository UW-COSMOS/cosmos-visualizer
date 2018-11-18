import {Component} from 'react'
import h from 'react-hyperscript'
import {DragRectangle, Rectangle} from './drag-rect'

class Overlay extends Component
  constructor: (props)->
    super props

  renderRectangles: ->
    {rectangles, width, height, editingRect, actions} = @props
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
    h 'div.overlay', {style}, [
      @renderRectangles()...
    ]

export {Overlay}
