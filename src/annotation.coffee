import {Component} from 'react'
import h from 'react-hyperscript'
import {Rectangle, DragRectangle} from './drag-rect'
import {Select} from '@blueprintjs/select'
import {Navbar, MenuItem, Button, Intent} from '@blueprintjs/core'

class Tag extends Component
  render: ->
    {boxes, rest...} = @props
    h 'div.tag', boxes.map (d)->
      h Rectangle, {bounds: d, rest...}

class ActiveTag extends Component
  render: ->
    {boxes, update: __update, rest...} = @props
    h 'div.tag.active', boxes.map (d,i)=>
      update = (spec)=>
        {bounds: subSpec} = spec
        return unless subSpec?
        __update {boxes: {[i]: subSpec}}
      props = {bounds: d, update, rest...}
      h DragRectangle, props, @renderControls()

  setTag: (tag)=>
    {update} = @props
    console.log tag
    update {tag_id: {$set: tag.tag_id}}

  renderControls: =>
    {tags, tag_id, delete: deleteRectangle} = @props
    currentTag = tags.find (d)-> d.tag_id == tag_id
    className = @editingMenuPosition()

    h 'div.rect-controls', {className}, [
      h Select, {
        items: tags
        itemRenderer: (t, {handleClick})->
          h MenuItem, {
            key: t.tag_id,
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

  editingMenuPosition: =>
    {boxes, maxPosition, scaleFactor} = @props
    [x,y,maxX,maxY] = boxes[0]
    maxY /= scaleFactor
    if maxPosition?
     if maxY > maxPosition.height-50
        return 'top'
    return 'bottom'


export {Tag, ActiveTag}
