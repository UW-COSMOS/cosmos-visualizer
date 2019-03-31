import {Component, memo} from 'react'
import h from 'react-hyperscript'
import classNames from 'classnames'
import {APIResultView, GDDReferenceCard} from '@macrostrat/ui-components'
import {basename} from 'path'
import {memoize} from 'underscore'
import styled from '@emotion/styled'

KBImage = (props)->
  {path, rest...} = props
  src = path.replace "img/", "/kb-images/"
  h 'img', {src, rest...}

getEntityType = (path)->
  # Hack to get entity type from image path
  basename(path, '.png').replace(/\d+$/, "")

class KBExtraction extends Component
  render: ->
    {unicode, path, className, title} = @props
    entityType = getEntityType(path)
    if entityType == "Body Text"
      return null

    className = classNames(className, "extracted-entity")

    h 'div', {className}, [
      h 'div.main', [
        h 'div.kb-image-container', [
          h 'h2', [
            entityType
          ]
          h KBImage, {path}
        ]
      ]
    ]

toLowerCase = memoize (t)->
  t.toLowerCase()

MatchSpan = styled.span"""
  display: inline-block;
  background-color: dodgerblue;
  border-radius: 2px;
  padding: 1px 2px;
  color: white;
"""

EntityType = styled.span"""
  font-style: italic;
  color: #888;
  font-weight: 400;
"""

MatchParagraph = styled.p"""
  font-size: 0.8em;
  padding: 0.5em 1em;
"""

TextMatch = (props)->
  {query, text, entityType} = props
  matchText = toLowerCase(text)

  return null unless query?
  return null if query == ""
  ix = matchText.indexOf(query.toLowerCase())
  console.log ix
  ixEnd = ix + query.length
  start = ix-100
  end = ixEnd+100

  # Clamp endpoints
  start = 0 if start < 0
  end = text.length if end > text.length

  match = text.substring(ix, ixEnd)
  return h "div.match", [
    h 'h2', [
      "Match "
      h EntityType, "(in #{entityType})"
    ]
    h MatchParagraph, [
      text.substring(start, ix)
      h MatchSpan, text.substring(ix, ixEnd)
      text.substring(ixEnd, end)
    ]
  ]

class ModelExtraction extends Component
  render: ->
    {query} = @props
    # Stupid hack
    docid = @props.target_img_path.match(/([a-f0-9]{24})/g)[0]

    assoc = null
    if @props.assoc_img_path?
      assoc = h KBExtraction, {
        title: "Associated entity"
        path: @props.assoc_img_path
        unicode: @props.assoc_unicode
      }

    h 'div.model-extraction', [
      h KBExtraction, {
        title: "Extracted entity"
        className: 'target'
        path: @props.target_img_path
        unicode: @props.target_unicode
      }
      assoc
      h TextMatch, {
        entityType: getEntityType(@props.target_img_path),
        text: @props.target_unicode,
        query
      }
      h GDDReferenceCard, {docid}
    ]

export {ModelExtraction}
