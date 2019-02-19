import {Component} from 'react'
import h from 'react-hyperscript'
import {Rectangle, DragRectangle} from './drag-rect'

class Tag extends Component
  render: ->
    {boxes, rest...} = @props
    h 'div.tag', boxes.map (d)->
      h Rectangle, {bounds: d, rest...}

class ActiveTag extends Component
  render: ->
    {boxes, update, rest...} = @props
    h 'div.tag.active', boxes.map (d,i)->
      __update = (spec)=>
        {bounds: subSpec} = spec
        return unless subSpec?
        update {boxes: {[i]: subSpec}}
      h DragRectangle, {bounds: d, update: __update, rest...}

export {Tag, ActiveTag}
