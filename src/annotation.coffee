import {Component} from 'react'
import h from 'react-hyperscript'
import {min, max} from 'd3-array'
import {DragRectangle, Rectangle} from './drag-rect'
import {Select} from '@blueprintjs/select'
import {Navbar, MenuItem, Button, Intent} from '@blueprintjs/core'
import chroma from 'chroma-js'

tagBounds = (boxes)->
  return [
    min boxes, (d)->d[0]
    min boxes, (d)->d[1]
    max boxes, (d)->d[2]
    max boxes, (d)->d[3]
  ]

tagCenter = (boxes)->
  d = tagBounds(boxes)
  return [(d[0]+d[2])/2, (d[1]+d[3])/2]

class Tag extends Component
  tagUpdater: (ix)=>
    {update} = @props
    return null unless update?
    # Return an updater function
    return (spec)=>
      {bounds: subSpec} = spec
      return unless subSpec?
      update {boxes: {[ix]: subSpec}}

  color: =>
    {tags, tagData, tag_id} = @props
    tagData = tags.find (d)->d.tag_id == tag_id
    chroma(tagData.color)

  isSelected: =>
    {update} = @props
    return update?

  renderTags: =>
    {boxes, update, color, rest...} = @props
    alpha = 0.2
    if @isSelected()
      alpha = 0.6

    c = @color()
    color = c.alpha(alpha).css()

    className = null
    if update?
      className = 'active'
    h 'div.tag', {className}, boxes.map (d, i)=>
      update = @tagUpdater(i)
      h Rectangle, {bounds: d, update, color, rest...}

  render: =>
    {boxes, update, name, tags, tag_id, rest...} = @props
    isActive = update?
    overallBounds = tagBounds(boxes)

    c = @color()
    alpha = 0.2
    if @isSelected()
      alpha = 0.6
    color = c.alpha(alpha).css()
    textColor = c.darken(2)

    tagData = tags.find (d)->d.tag_id == tag_id
    name = h 'div.tag-name', {style: {color: textColor}}, tagData.name


    h 'div.contents', [
      h Rectangle, {
        bounds: overallBounds,
        color, backgroundColor: 'none',
        rest...
        }, [
        name
        @renderControls()
      ]
      @renderTags()
    ]

  renderControls: => null


class ActiveTag extends Tag
  setTag: (tag)=>
    {update} = @props
    console.log tag
    update {tag_id: {$set: tag.tag_id}}

  renderControls: =>
    {tags, tag_id, delete: deleteRectangle} = @props
    return null if not @isSelected()
    currentTag = tags.find (d)-> d.tag_id == tag_id
    className = @editingMenuPosition()

    # Make sure clicks on the control panel don't dismiss it
    # due to the competing overlay click handler
    onClick = (event)->
      event.stopPropagation()

    h 'div.rect-controls', {className, onClick}, [
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

export {Tag, ActiveTag, tagCenter, tagBounds}
