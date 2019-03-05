import {Component} from 'react'
import h from 'react-hyperscript'
import {EditorContext} from '../overlay/context'
import {bboxPolygon, featureCollection,
        polygonToLine,
        nearestPointOnLine,
        centroid, combine} from '@turf/turf'

class MarkerBox extends Component
  @id: (color)->
    console.log color
    return "box-"+color.replace("#",'')
  render: ->
    {color} = @props
    h 'marker', {
      id: @constructor.id(color)
      markerWidth: 4
      markerHeight: 4
      refX: 2
      refY: 2
    }, (
      h 'rect', {x: 0, y: 0, width: 4, height: 4, fill: color}
    )

class MarkerArrow extends Component
  @id: (color)->
    return "arrow-"+color.replace("#",'')
  render: ->
    {color} = @props
    h 'marker', {
      markerWidth: 10
      markerHeight: 10
      refX: 8
      refY: 3
      orient: "auto"
      markerUnits: "strokeWidth"
      id: @constructor.id(color)
      viewBox: "0 0 15 15"
    }, (
      h 'path', {d: "M0,0 L0,6 L9,3 z", fill: color}
    )

class AnnotationLinks extends Component
  @contextType: EditorContext
  renderDefs: (links)->
    colors = new Set links.map((l)->l.color.hex())
    h 'defs', Array.from(colors).map (c)-> [
        h MarkerBox, {color: c, key: 'box'}
        h MarkerArrow, {color: c, key: 'arrow'}
      ]

  render: ->
    {width, height} = @props
    links = @computeLinks()
    h 'svg.annotation-links', {width, height}, [
      @renderDefs(links)
      h 'g.links', links.map (l)->
        [x1,y1,x2,y2] = l.coords
        color = l.color.hex()
        h 'line', {
          x1,x2,y1,y2,
          stroke: color,
          strokeWidth: "2px"
          markerEnd: "url(##{MarkerArrow.id(color)})"
          markerStart: "url(##{MarkerBox.id(color)})"
        }
    ]

  computeLinks: =>
    {image_tags, scaleFactor, tags} = @props
    {tagColor} = @context.helpers

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

      color = tagColor(fromTag.tag_id)
      links.push {coords, color}

    return links

export {AnnotationLinks}
