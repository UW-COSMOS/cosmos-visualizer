import {Component} from 'react'
import h from 'react-hyperscript'
import classNames from 'classnames'
import {basename} from 'path'

KBImage = (props)->
  {path, rest...} = props
  src = path.replace "img/", "/kb-images/"
  h 'img', {src, rest...}

class KBExtraction extends Component
  render: ->
    {unicode, path, className, title} = @props
    entityType = basename(path, '.png').replace(/\d+$/, "")

    className = classNames(className, "extracted-entity")

    h 'div', {className}, [
      h 'div.main', [
        h 'div.kb-image-container', [
          h 'h2', [
            entityType
            " "
            h 'span.entity-type', "(#{title})"
          ]
          h KBImage, {path}
        ]
        h 'div.text', [
          h 'h4', 'Unicode'
          h 'p.text', unicode
        ]
      ]
    ]


class ModelExtraction extends Component
  render: ->
    console.log @props
    assoc = null
    if @props.assoc_img_path?
      assoc = h KBExtraction, {
        title: "Associated entity"
        path: @props.assoc_img_path
        unicode: @props.assoc_unicode
      }

    h 'div.model-extraction', [
      assoc
      h KBExtraction, {
        title: "Extracted entity"
        className: 'target'
        path: @props.target_img_path
        unicode: @props.target_unicode
      }
    ]

export {ModelExtraction}
