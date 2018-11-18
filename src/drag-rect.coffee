# A d3/react rectangle dragging component
# Prior art:
# - http://bl.ocks.org/mccannf/1629464
# - https://bl.ocks.org/d3noob/204d08d309d2b2903e12554b0aef6a4d
import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import {select, event, mouse} from 'd3-selection'
import {drag} from 'd3-drag'
import h from 'react-hyperscript'

Handle = ({side, margin})->
  margin ?= 4
  if ['top','bottom'].includes side
    style = {left: margin, right: margin, height: 2*margin}
  else
    style = {top: margin, bottom: margin, width: 2*margin}
  style[side] = -margin
  className = side

  return h 'div', {style, className, __data__: side}

class DragRect extends Component
  startRect: null
  render: ->
    {x,y,width,height, color} = @props
    margin = 4
    style = {
      top: y, left: x,
      width, height,
      backgroundColor: color
    }

    ew = {top: margin, bottom: margin, width: 2*margin}
    ns = {left: margin, right: margin, height: 2*margin}
    h 'div.drag-rect', {style}, [
      h 'div.handles', [
        h Handle, {side: 'top'}
        h Handle, {side: 'bottom'}
        h Handle, {side: 'left'}
        h Handle, {side: 'right'}
      ]
    ]

  mouseCoords: ->
    {screenX: x, screenY: y} = event.sourceEvent
    {x,y}

  dragSubject: =>
    console.log "Computed subject"
    {x,y, width, height} = @props
    source = @mouseCoords()
    return {x,y, width, height, source}

  handleDrag: (side)=>
    {subject: s} = event
    {width, height, x,y, source} = s
    client = @mouseCoords()
    dx = client.x-source.x
    dy = client.y-source.y
    {updateRect, maxPosition} = @props

    if side == 'top'
      y = s.y+dy
      height -= dy
    else if side == 'bottom'
      height += dy
    else if side == "right"
      width += dx
    else if side == 'left'
      x = s.x+dx
      width -= dx
    else
      # Drag the entire box
      {x,y} = event

    x = 0 if x < 0
    y = 0 if y < 0

    if maxPosition?
      maxX = maxPosition.width-width
      maxY = maxPosition.height-height
      x = maxX if x > maxX
      y = maxY if y > maxY

    updateRect {x,y,width,height}

  componentDidMount: ->
    el = select findDOMNode @
    {handleDrag} = @

    edgeDrag = drag()
      .subject @dragSubject
      .on "drag", ->
        d = @getAttribute('__data__')
        handleDrag(d)

    el.selectAll '.handles div'
      .call edgeDrag

    el.call edgeDrag

export {DragRect}
