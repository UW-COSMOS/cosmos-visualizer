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
    {path, bytes, rest...} = @props
    if bytes?
        src="data:image/png;base64," + bytes
    else
        fn = path.replace "img/", ""
        src = join(publicURL,"kb-images", fn)
    
    h 'img', {src, rest...}

class KBCode extends Component
  render: ->
    {publicURL} = @context
    {path, entityType, unicode, rest...} = @props
    h('div', {style: {'font-family': 'monospace'}}, unicode)

getEntityType = (path)->
  # Hack to get entity type from image path
  basename(path, '.png').replace(/\d+$/, "")

class KBExtraction extends Component
  render: ->
    {unicode, path, className, title, entityType, rest...} = @props
    #entityType = getEntityType(path)
    #if entityType == "Body Text"
      #return null

    className = classNames(className, "extracted-entity")

    h 'div', {className}, [
      h 'div.main', [
        h 'div.kb-image-container', [
          h 'h2', [
            entityType
          ]
          if entityType == "code"
            h KBCode, {path, entityType, unicode, rest...}
          else
            h KBImage, {path, entityType, rest...}
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
     assoc_img_path, assoc_unicode, bytes, content, pdf_name, _id, page_num, filename, line_number, full_content} = @props

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

    # TODO: handle the new format here.
    if bytes?
      main_img_path = 'page ' + page_num + ' of docid ' + _id.replace('.pdf', '')
      main_unicode = content
      assoc = h KBExtraction, {
        title: "Extracted thing"
        bytes: bytes
        unicode: content
        path: _id
        entityType: entityType
      }

    if full_content?
      main_img_path = 'line ' + line_number + ' of file ' + filename
      main_unicode = full_content
      entityType = this.props['class']
      assoc = h KBExtraction, {
        title: "Extracted thing"
        unicode: content
        path: _id
        entityType: entityType
      }

    # We don't have a result unless either main or target are defined
    return null unless main_img_path?

    try
      # Stupid hack
      docid = main_img_path.match(/([a-f0-9]{24})/g)[0]
      gddCard = h GDDReferenceCard, {docid}
    catch
      gddCard = null

    try
      docid = pdf_name.match(/([a-f0-9]{24})/g)[0]
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
