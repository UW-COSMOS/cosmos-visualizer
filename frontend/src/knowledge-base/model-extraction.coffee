import {Component, memo} from 'react'
import h from 'react-hyperscript'
import classNames from 'classnames'
import {GDDReferenceCard} from '@macrostrat/ui-components'
import {join, basename} from 'path'
import {memoize} from 'underscore'
import styled from '@emotion/styled'
import {ImageStoreContext} from '../image-container'

class KBImage extends Component
  @contextType: ImageStoreContext
  render: ->
    {publicURL} = @context
    {path, rest...} = @props
    fn = path.replace "img/", ""
    src = join(publicURL,"kb-images", fn)
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

sanitize = memoize (t)->
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
  return null unless text?
  text = sanitize(text)

  return null unless query?
  return null if query == ""
  ix = text.indexOf(sanitize(query))
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
    {query, target_img_path, target_unicode,
     assoc_img_path, assoc_unicode} = @props

    main_img_path = null
    main_unicode = null

    assoc = null
    if assoc_img_path?
      main_img_path = assoc_img_path
      main_unicode
      assoc = h KBExtraction, {
        title: "Associated entity"
        path: assoc_img_path
        unicode: assoc_unicode
      }

    # Don't assume existence of target
    target = null
    if target_img_path?
      main_img_path = target_img_path
      main_unicode = target_unicode
      target = h KBExtraction, {
        title: "Extracted entity"
        className: 'target'
        path: target_img_path
        unicode: target_unicode
      }

    # We don't have a result unless either main or target are defined
    return null unless main_img_path?

    try
      # Stupid hack
      docid = main_img_path.match(/([a-f0-9]{24})/g)[0]
      gddCard = h GDDReferenceCard, {docid}
    catch
      gddCard = null

    h 'div.model-extraction', [
      target
      assoc
      h TextMatch, {
        entityType: getEntityType(main_img_path),
        text: main_unicode,
        query
      }
      gddCard
    ]

export {ModelExtraction}
