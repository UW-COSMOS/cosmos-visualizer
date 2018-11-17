# A d3/react rectangle dragging component
# Prior art:
# - http://bl.ocks.org/mccannf/1629464
# - https://bl.ocks.org/d3noob/204d08d309d2b2903e12554b0aef6a4d

import {Component} from 'react'
import h from 'react-hyperscript'

class DragRect extends Component
  render: ->
    {x,y,width,height, color} = @props
    margin = 4
    style = {
      top: "#{y}px", left: "#{x}px",
      width, height,
      backgroundColor: color
    }

    ew = {top: margin, bottom: margin, width: 2*margin}
    ns = {left: margin, right: margin, height: 2*margin}
    h 'div.drag-rect', {style}, [
      h 'div.handles', [
        h 'div.top', {style: {top: -margin, ns...}}
        h 'div.bottom', {style: {bottom: -margin, ns...}}
        h 'div.left', {style: {left: -margin, ew...}}
        h 'div.right', {style: {right: -margin, ew...}}
      ]
    ]

export {DragRect}
