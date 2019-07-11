import {Component} from 'react'
import h from 'react-hyperscript'
import {min, max} from 'd3-array'
import {DragRectangle, Rectangle} from './drag-rect'
import {Select} from '@blueprintjs/select'
import {Navbar, MenuItem, Button, Intent} from '@blueprintjs/core'
import classNames from 'classnames'
import {EditMode} from '../enum'
import {EditorContext} from '../image-overlay/context'

ToolButton = (props)->
  h Button, {small: true, minimal: true, props...}

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
  @contextType: EditorContext
  @defaultProps: {
    enterLinkMode: ->
  }
  tagUpdater: (ix)=>
    {update} = @props
    return null unless update?
    # Return an updater function
    return (spec)=>
      {bounds: subSpec} = spec
      return unless subSpec?
      update {boxes: {[ix]: subSpec}}

  isSelected: =>
    {update} = @props
    return update?

  renderTags: (color)=>
    {boxes, update, rest...} = @props

    className = null
    if update?
      className = 'active'

    h 'div.tag', {className}, boxes.map (d, i)=>
      update = @tagUpdater(i)
      h Rectangle, {
        bounds: d,
        update,
        color,
      rest...}, @boxContent(i)

  render: =>
    {tags} = @context
    {boxes, update, name, tag_id, rest...} = @props

    overallBounds = tagBounds(boxes)

    c = @context.helpers.tagColor(tag_id)
    alpha = 0.3
    if @isSelected()
      alpha = 0.6

    color = c.alpha(alpha).css()
    textColor = c.darken(2)

    tagData = tags.find (d)->d.tag_id == tag_id
    # Sometimes we don't return tags
    tagData ?= {}
    name = h 'div.tag-name', {style: {color: textColor}}, tagData.name or name

    active = @isSelected()
    className = classNames {active}
    h 'div.annotation', {className}, [
      h Rectangle, {
        bounds: overallBounds,
        color, backgroundColor: 'none',
        style: {pointerEvents: 'none'}
        rest...
        }, [
        name
        @renderControls()
      ]
      @renderTags(color)
    ]

  setTag: (tag)=>
    {update} = @props
    console.log tag
    update {tag_id: {$set: tag.tag_id}}

  renderLinkButton: =>
    {update, enterLinkMode} = @props
    {actions: {setMode}, editModes} = @context
    removeLink = ->
      update {linked_to: {$set: null}}

    if @props.linked_to?
      return h ToolButton, {
        icon: 'ungroup-objects'
        onClick: removeLink
      }
    return h ToolButton, {
      icon: 'new-link'
      intent: if editModes.has(EditMode.LINK) then Intent.SUCCESS
      onClick: -> setMode(EditMode.LINK)
    }

  boxContent: (i)=>
    {update, boxes} = @props
    return null if boxes.length <= 1

    # Need actual logic here
    editingDisabled = true
    return null if editingDisabled
    h ToolButton, {
      icon: 'cross'
      className: 'delete-rect'
      intent: Intent.DANGER
      onClick: => update {boxes: {$splice: [[i,1]]}}
    }

  renderControls: =>
    {tags} = @context
    {tag_id, linked_to, update, delete: deleteRectangle, onSelect, enterLinkMode} = @props
    return null if not @isSelected()
    currentTag = tags.find (d)-> d.tag_id == tag_id
    className = @editingMenuPosition()
    {actions: {setMode}, editModes} = @context

    # Make sure clicks on the control panel don't dismiss it
    # due to the competing overlay click handler
    onClick = (event)->
      event.stopPropagation()

    h 'div.rect-controls', {className, onClick, style: {pointerEvents: 'visible'}}, [
      h ToolButton, {
        icon: 'tag'
        onClick: onSelect
      }
      @renderLinkButton()
      h ToolButton, {
        icon: 'insert'
        intent: if editModes.has(EditMode.ADD_PART) then Intent.SUCCESS
        onClick: -> setMode(EditMode.ADD_PART)
      }
      h ToolButton, {
        icon: 'cross'
        intent: Intent.DANGER
        onClick: deleteRectangle
      }
    ]

  editingMenuPosition: =>
    {imageSize: maxPosition, scaleFactor} = @context
    {boxes} = @props
    [x,y,maxX,maxY] = boxes[0]
    maxY /= scaleFactor
    if maxPosition?
     if maxY > maxPosition.height-50
        return 'top'
    return 'bottom'

class LockedTag extends Component
  @contextType: EditorContext

  render: =>
    {boxes, tag_id, rest...} = @props
    {scaleFactor, imageSize: maxPosition} = @context

    c = @context.helpers.tagColor(tag_id)
    alpha = 0.2
    color = c.alpha(alpha).css()

    h 'div.annotation.locked', boxes.map (d, i)=>
      h Rectangle, {
        bounds: d,
        color,
        scaleFactor,
        maxPosition,
        rest...
      }

export {Tag, LockedTag, tagCenter, tagBounds}
