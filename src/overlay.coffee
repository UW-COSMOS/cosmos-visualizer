import {Component} from 'react'
import h from 'react-hyperscript'
import {select, event} from 'd3-selection'
import {drag} from 'd3-drag'
import {findDOMNode} from 'react-dom'
import {Hotkey, Hotkeys, HotkeysTarget} from "@blueprintjs/core"
import {bboxPolygon, featureCollection,
        polygonToLine,
        nearestPointOnLine,
        centroid, combine} from '@turf/turf'

import {Tag, ActiveTag, tagCenter} from './annotation'

class AnnotationLinks extends Component
  renderDefs: ->
    h 'defs', [
      h 'marker#arrow', {
        markerWidth: 10
        markerHeight: 10
        refX: 8
        refY: 3
        orient: "auto"
        markerUnits: "strokeWidth"
        viewBox: "0 0 15 15"
      }, (
        h 'path', {d: "M0,0 L0,6 L9,3 z", fill: "#444"}
      )
    ]
  render: ->
    {width, height, links} = @props
    h 'svg.annotation-links', {width, height}, [
      @renderDefs()
      h 'g.links', links.map (l)->
        [x1,y1,x2,y2] = l.coords
        h 'line', {
          x1,x2,y1,y2,
          stroke: l.color,
          strokeWidth: "2px"
          markerEnd: "url(#arrow)"
        }
    ]

class Overlay extends Component
  @defaultProps: {
    # Distance we take as a click before switching to drag
    clickDistance: 10
    editingEnabled: true
  }
  constructor: (props)->
    super props
    @state = {
      inProgressAnnotation: null
    }

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

      onClick = (event)=>
        # Make sure we don't activate the general
        # general click or drag handlers
        event.stopPropagation()
        if event.shiftKey
          do actions.addLink(ix)
        else
          do actions.selectAnnotation(ix)

      if _editing
        return h ActiveTag, {
          delete: actions.deleteAnnotation(ix)
          update: actions.updateAnnotation(ix)
          opts...
        }
      return h Tag, {onClick, opts...}

  computeLinks: =>
    {image_tags, scaleFactor} = @props

    boxPolygon = (boxes)->
      polys = boxes
        .map (box)->
          box.map (d)->d/1000
        .map(bboxPolygon)
      combine(featureCollection(polys)).features[0]

    links = []
    for fromTag in image_tags
      {linked_to} = fromTag
      continue unless linked_to?
      toTag = image_tags.find (d)->
        d.image_tag_id == linked_to
      continue unless toTag?

      p1 = boxPolygon(fromTag.boxes)
      p2 = boxPolygon(toTag.boxes)
      ext1 = polygonToLine(p1).features[0]
      ext2 = polygonToLine(p2).features[0]

      # Get the centroid of the first point
      c1 = centroid p1
      c2 = centroid p2
      e1 = nearestPointOnLine ext1, c2
      e2 = nearestPointOnLine ext2, e1
      c1 = e1.geometry.coordinates
      c2 = e2.geometry.coordinates

      coords = [c1...,c2...].map (d)->d/scaleFactor*1000

      color = "#444444"
      links.push {coords, color}

    return links

  render: ->
    {width, height, rest...} = @props
    size = {width, height}

    onClick = @disableEditing
    h 'div', [
      h 'div.overlay', {style: size, onClick}, @renderAnnotations()
      h AnnotationLinks, {links: @computeLinks(), size...}
    ]

  handleDrag: =>
    {subject} = event
    {x,y} = subject
    {clickDistance, currentTag, scaleFactor, editingEnabled} = @props
    console.log "Started dragging"
    return if not editingEnabled
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
    {shiftKey} = event.sourceEvent
    {actions, editingRect} = @props
    {inProgressAnnotation: r} = @state
    @setState {inProgressAnnotation: null}

    return unless r?
    if shiftKey and editingRect?
      # We are adding a box to the currently
      # selected annotation
      fn = actions.updateAnnotation(editingRect)
      fn {boxes: {$push: r.boxes}}
    else
      actions.appendAnnotation r

  disableEditing: =>
    {actions,editingRect} = @props
    if editingRect?
      __ = {editingRect: {$set: null}}
      actions.updateState __

  renderHotkeys: ->
    {editingRect, actions} = @props
    h Hotkeys, null, [
      h Hotkey, {
        label: "Delete rectangle"
        combo: "backspace"
        global: true
        disabled: not editingRect?
        onKeyDown: (evt)=>
          actions.deleteAnnotation(editingRect)()
          evt.preventDefault()
      }
    ]

  componentDidMount: ->
    el = select findDOMNode @

    # Set up dragging when rectangle is not clicked
    @edgeDrag = drag()
      .on "drag", @handleDrag
      .on "end", @handleAddAnnotation
      .clickDistance @props.clickDistance

    el.call @edgeDrag

Overlay = HotkeysTarget(Overlay)

export {Overlay}
