import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {findDOMNode} from 'react-dom'
import {Hotkey, Hotkeys, HotkeysTarget, Intent} from "@blueprintjs/core"
import {Tag, ActiveTag, tagColor} from '../annotation'
import {AnnotationLinks} from './annotation-links'
import {TypeSelector} from './type-selector'
import {StatefulComponent} from '../util'
import {EditorContext} from './context'

import {EditMode} from '../enum'
import {Toast, Toaster, Position} from '@blueprintjs/core'

import './main.styl'

{ADD_PART, LINK} = EditMode

Messages = {
  [ADD_PART]: "Add part"
  [LINK]: "Add link"
}

SHIFT_MODES = new Set([LINK, ADD_PART])

class ModalNotifications extends Component
  @contextType: EditorContext
  renderToast: (mode)->
    {actions, editModes} = @context
    return null unless editModes.has(mode)
    message = Messages[mode]
    onDismiss = =>
      actions.setMode(mode, false)
    h Toast, {message, onDismiss, timeout: 0, intent: Intent.SUCCESS}

  render: ->
    h 'div.notifications', [
      @renderToast(ADD_PART)
      @renderToast(LINK)
    ]

class Overlay extends StatefulComponent
  @defaultProps: {
    # Distance we take as a click before switching to drag
    clickDistance: 10
    editingEnabled: true
    selectIsOpen: false
  }
  constructor: (props)->
    super props
    @state = {
      inProgressAnnotation: null
      editModes: new Set()
      shiftKey: false
    }

  componentWillReceiveProps: (nextProps)=>
    return if nextProps.editingRect == @props.editingRect
    return if nextProps.editingRect?
    @updateState {editModes: {$set: new Set()}}

  selectAnnotation: (ix)=>(event)=>
    {actions, editModes} = @contextValue()
    # Make sure we don't activate the general
    # general click or drag handlers
    #event.stopPropagation()
    if editModes.has(LINK)
      do actions.addLink(ix)
      actions.setMode(LINK, false)
    else
      do actions.selectAnnotation(ix)

  renderAnnotations: ->
    {inProgressAnnotation} = @state
    {image_tags, tags, width, height,
     editingRect, actions, scaleFactor} = @props

    if inProgressAnnotation?
      editingRect = null
      image_tags = [image_tags..., inProgressAnnotation]

    image_tags.map (d, ix)=>
      _editing = ix == editingRect

      opacity = if _editing then 0.5 else 0.3

      opts = {
        key: ix
        d...
        tags
        scaleFactor
        maxPosition: {width, height}
      }

      if _editing
        return h ActiveTag, {
          delete: actions.deleteAnnotation(ix)
          update: actions.updateAnnotation(ix)
          onSelect: @toggleSelect
          enterLinkMode: ->
          opts...
        }
      onMouseDown = =>
        console.log "Clicked rect"
        return if editingRect == ix
        do @selectAnnotation(ix)

      return h Tag, {onClick: @selectAnnotation(ix), onMouseDown, opts...}

  renderInterior: ->
    {editingRect, width, height, image_tags,
     scaleFactor, tags, rest...} = @props
    size = {width, height}
    {selectIsOpen} = @state

    onClick = @disableEditing

    h 'div', [
      h ModalNotifications
      h TypeSelector, {
        tags,
        isOpen: selectIsOpen
        onClose: => @setState {selectIsOpen: false}
        onItemSelect: @selectTag
      }
      h 'div.overlay', {style: size, onClick}, @renderAnnotations()
      h AnnotationLinks, {image_tags, scaleFactor, tags, size...}
    ]

  contextValue: =>
    {actions} = @props
    {editModes, shiftKey} = @state
    if shiftKey then editModes = SHIFT_MODES
    actions.setMode = @setMode
    {editModes, shiftKey, actions, update: @updateState}

  setMode: (mode, val)=>
    val ?= not @state.editModes.has(mode)
    action = if val then "$add" else "$remove"
    @updateState {editModes: {[action]: [mode]}}

  render: ->
    h EditorContext.Provider, {value: @contextValue()}, @renderInterior()

  selectTag: (tag)=>
    # Selects the Tag ID for active annotation
    {actions, editingRect} = @props
    if editingRect?
      # Set tag for the active rectangle
      fn = actions.updateAnnotation(editingRect)
      fn {tag_id: {$set: tag.tag_id}}
    else
      do actions.updateCurrentTag(tag.tag_id)
    @setState {selectIsOpen: false}

  handleDrag: =>
    {subject} = event
    {x,y} = subject
    {clickDistance, editingRect, currentTag,
     scaleFactor, editingEnabled, image_tags} = @props
    return if not editingEnabled

    # Make sure we color with the tag this will be
    {editModes} = @contextValue()
    if editModes.has(ADD_PART) and editingRect?
      currentTag = image_tags[editingRect].tag_id

    scaleFactor ?= 1
    width = event.x-x
    height = event.y-y
    if width < 0
      width *= -1
      x -= width
    if height < 0
      height *= -1
      y -= height
    return if width < clickDistance
    return if height < clickDistance
    # Shift to image coordinates from pixel coordinates
    x *= scaleFactor
    y *= scaleFactor
    width *= scaleFactor
    height *= scaleFactor

    # We are adding a new annotation
    boxes = [[x,y,x+width,y+height]]
    rect = {boxes, tag_id: currentTag}
    @setState {inProgressAnnotation: rect}

  handleAddAnnotation: =>
    {actions, editingRect} = @props
    {inProgressAnnotation: r} = @state
    @setState {inProgressAnnotation: null}

    return unless r?
    {editModes} = @contextValue()
    if editModes.has(ADD_PART) and editingRect?
      # We are adding a box to the currently
      # selected annotation
      fn = actions.updateAnnotation(editingRect)
      fn {boxes: {$push: r.boxes}}
      # Disable linking mode
    else
      actions.appendAnnotation r
    @setMode(ADD_PART, false)

  disableEditing: =>
    {actions,editingRect} = @props
    return unless editingRect?
    __ = {editingRect: {$set: null}}
    actions.updateState __

  toggleSelect: =>
    console.log "Opening select box"
    @setState {selectIsOpen: true}

  renderHotkeys: ->
    {editingRect, actions} = @props
    h Hotkeys, null, [
      h Hotkey, {
        label: "Delete rectangle"
        combo: "backspace"
        global: true
        preventDefault: true
        onKeyDown: (evt)=>
          return unless editingRect?
          actions.deleteAnnotation(editingRect)()
      }
      h Hotkey, {
        global: true
        combo: "l"
        label: "Toggle select"
        onKeyDown: @toggleSelect
        #prevent typing "O" in omnibar input
        preventDefault: true
      }
      h Hotkey, {
        label: "Expose secondary commands"
        combo: "shift"
        global: true
        onKeyDown: @handleShift(true)
      }
    ]

  handleShift: (val)=> =>
    @setState {shiftKey: val}

  componentDidMount: ->
    el = select findDOMNode @

    # Set up dragging when rectangle is not clicked
    @edgeDrag = drag()
      .on "drag", @handleDrag
      .on "end", @handleAddAnnotation
      .clickDistance @props.clickDistance

    el.call @edgeDrag

    select(document).on 'keyup', (d)=>
      if @state.shiftKey and not event.shiftKey
        do @handleShift(false)

Overlay = HotkeysTarget(Overlay)

export {Overlay}
