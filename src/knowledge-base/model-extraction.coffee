import {Component, memo} from 'react'
import h from 'react-hyperscript'
import classNames from 'classnames'
import {APIResultView, GDDReferenceCard} from '@macrostrat/ui-components'
import {basename} from 'path'

KBImage = (props)->
  {path, rest...} = props
  src = path.replace "img/", "/kb-images/"
  h 'img', {src, rest...}

class KBExtraction extends Component
  render: ->
    {unicode, path, className, title} = @props
    entityType = basename(path, '.png').replace(/\d+$/, "")
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

class ModelExtraction extends Component
  render: ->
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
      h GDDReferenceCard, {docid}
    ]

export {ModelExtraction}
