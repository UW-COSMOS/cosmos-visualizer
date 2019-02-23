# A d3/react rectangle dragging component
# Prior art:
# - http://bl.ocks.org/mccannf/1629464
# - https://bl.ocks.org/d3noob/204d08d309d2b2903e12554b0aef6a4d
import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import {select, event, mouse} from 'd3-selection'
import {drag} from 'd3-drag'
import h from 'react-hyperscript'

getSize = (bounds)->
  [x,y, xMax, yMax] = bounds
  width = xMax-x
  height = yMax-y
  {x,y,width,height}

oppositeSide = (s)->
  return 'top' if s == 'bottom'
  return 'left' if s == 'right'
  return 'right' if s == 'left'
  return 'bottom' if s == 'top'

Handle = ({side, margin})->
  margin ?= 4
  style = {
    left: margin, right: margin,
    top: margin, bottom: margin
    width: 2*margin, height: 2*margin
  }

  if ['top','bottom'].includes side
    style.width = null
  if ['left','right'].includes side
    style.height = null

  for s in side.split(" ")
    style[s] = -margin
    style[oppositeSide(s)] = null

  className = side

  return h 'div', {style, className, __data__: side}

class StaticRectangle extends Component
  @defaultProps: {
    isSelected: false
    scaleFactor: 1 # Maps pixel scale to external scale
  }
  render: ->
    {bounds, scaleFactor, children,
     onClick, className, tag_id,
     tags, color,
     backgroundColor, style, rest...} = @props
    {x,y,width, height} = getSize(bounds)

    backgroundColor ?= color

    width /= scaleFactor
    height /= scaleFactor

    style = {
      top: y/scaleFactor, left: x/scaleFactor,
      width, height,
      backgroundColor: backgroundColor
      borderColor: color
      style...
    }

    h 'div.rect', {style, onClick, className}, children

  componentDidMount: ->
    {onMouseDown, onClick} = @props
    return unless onMouseDown?
    el = select findDOMNode @
    el.on 'mousedown', onMouseDown

class DragRectangle extends Component
  @defaultProps: {
    minSize: {width: 10, height: 10}
  }
  render: ->
    {children, rest...} = @props
    margin = 4
    ew = {top: margin, bottom: margin, width: 2*margin}
    ns = {left: margin, right: margin, height: 2*margin}
    className = 'draggable'
    isSelected = true
    onClick = (e)->
      e.stopPropagation()

    h StaticRectangle, {rest..., className, isSelected, onClick}, [
      h 'div.handles', [
        h Handle, {side: 'top'}
        h Handle, {side: 'bottom'}
        h Handle, {side: 'left'}
        h Handle, {side: 'right'}
        h Handle, {side: 'top right', margin: 6}
        h Handle, {side: 'bottom right', margin: 6}
        h Handle, {side: 'top left', margin: 6}
        h Handle, {side: 'bottom left', margin: 6}
      ]
      children
    ]

  mouseCoords: ->
    {screenX: x, screenY: y} = event.sourceEvent

  dragSubject: =>
    {bounds, scaleFactor} = @props
    {x,y,width,height} = getSize(bounds)

    source = @mouseCoords()
    scaleFactor ?= 1
    x /= scaleFactor
    y /= scaleFactor
    width /= scaleFactor
    height /= scaleFactor
    return {x,y, width, height, bounds, source}

  handleDrag: (side)=>
    side ?= ""
    {subject: s} = event
    {width, height, x,y, source, maxPosition} = s
    client = @mouseCoords()
    dx = client.x-source.x
    dy = client.y-source.y
    {update, minSize, maxPosition, scaleFactor} = @props
    scaleFactor ?= 1

    if side.includes('top')
      if dy > height
        dy = height
      y = s.y+dy
      height -= dy
    if side.includes('bottom')
      height += dy
    if side.includes("right")
      width += dx
    if side.includes('left')
      x = s.x+dx
      width -= dx
    if side == ""
      # Drag the entire box
      {x,y} = event

    if width < minSize.width
      width = minSize.width
    if height < minSize.height
      height = minSize.height

    x = 0 if x < 0
    y = 0 if y < 0

    if maxPosition?
      maxX = maxPosition.width-width
      maxY = maxPosition.height-height
      x = maxX if x > maxX
      y = maxY if y > maxY

    x *= scaleFactor
    y *= scaleFactor
    width *= scaleFactor
    height *= scaleFactor

    # Provide an update spec
    update {bounds: {$set: [x,y,x+width,y+height]}}
    event.sourceEvent.stopPropagation()

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

Rectangle = (props)->
  if props.update?
    return h DragRectangle, props
  return h StaticRectangle, props

export {DragRectangle, Rectangle}
