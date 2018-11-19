# A d3/react rectangle dragging component
# Prior art:
# - http://bl.ocks.org/mccannf/1629464
# - https://bl.ocks.org/d3noob/204d08d309d2b2903e12554b0aef6a4d
import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import {select, event, mouse} from 'd3-selection'
import {drag} from 'd3-drag'
import h from 'react-hyperscript'
import chroma from 'chroma-js'
import {Select} from '@blueprintjs/select'
import {Navbar, MenuItem, Button, Intent} from '@blueprintjs/core'

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

class Rectangle extends Component
  @defaultProps: {
    isSelected: false
  }
  render: ->
    {x,y,width,height, children,
     onClick, className, tag, tags, isSelected, rest...} = @props

    alpha = 0.2
    if isSelected
      alpha = 0.6

    tagData = tags.find (d)->d.id == tag
    c = chroma(tagData.color)
    textColor = c.darken(2)
    color = c.alpha(alpha).css()

    try
      name = h 'div.tag-name', {style: {color: textColor}}, tagData.name
    catch
      name = null

    style = {
      top: y, left: x,
      width, height,
      backgroundColor: color
      borderColor: color
    }

    h 'div.rect', {style, onClick, className}, [
      name
      children
    ]

class DragRectangle extends Component
  @defaultProps: {
    minSize: {width: 10, height: 10}
  }
  render: ->
    margin = 4
    ew = {top: margin, bottom: margin, width: 2*margin}
    ns = {left: margin, right: margin, height: 2*margin}
    className = 'draggable'
    isSelected = true
    onClick = (e)->
      e.stopPropagation()
    h Rectangle, {@props..., className, isSelected, onClick}, [
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
      @renderItems()
    ]

  renderItems: ->
    {tags, tag, delete: deleteRectangle} = @props
    currentTag = tags.find (d)-> d.id == tag
    h 'div.rect-controls', [
      h Select, {
        items: tags
        itemRenderer: (t, {handleClick})->
          h MenuItem, {
            key: t.id,
            onClick: handleClick
            text: t.name
          }
        onItemSelect: @setTag
        filterable: false
      }, [
        h Button, {
          text: currentTag.name
          rightIcon: "double-caret-vertical"
          className: 'select-box'
        }
      ]
      h Button, {
        icon: 'cross'
        intent: Intent.DANGER
        onClick: deleteRectangle
      }
    ]

  mouseCoords: ->
    {screenX: x, screenY: y} = event.sourceEvent

  dragSubject: =>
    {x,y, width, height} = @props
    source = @mouseCoords()
    return {x,y, width, height, source}

  setTag: (tag)=>
    {update, width, height, x, y} = @props
    update {width, height, x, y, tag: tag.id}

  handleDrag: (side)=>
    side ?= ""
    {subject: s} = event
    {width, height, x,y, source, maxPosition} = s
    client = @mouseCoords()
    dx = client.x-source.x
    dy = client.y-source.y
    {update, minSize, maxPosition, tag} = @props

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

    update {x,y,width,height,tag}
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

export {DragRectangle, Rectangle}
