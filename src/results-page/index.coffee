import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {select} from 'd3-selection'
import uuidv4 from 'uuid/v4'
import {findDOMNode} from 'react-dom'
import 'd3-jetpack'
import chroma from 'chroma-js'
import {Link} from 'react-router-dom'
import {Navbar, Button, ButtonGroup
        Intent, Alignment, Text, Icon} from "@blueprintjs/core"

import {StatefulComponent} from '../util'
import {AppToaster} from '../toaster'
import {Overlay} from '../overlay'
import {APIContext} from '../api'
import {InfoDialog} from '../info-dialog'

# Updates props for a rectangle
# from API signature to our internal signature
# TODO: make handle multiple boxes
class ResultsPageInner extends StatefulComponent
  @defaultProps: {
    allowSaveWithoutChanges: false
    editingEnabled: true
    navigationEnabled: true
    imageRoute: '/image'
  }
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      infoDialogIsOpen: false
      currentImage: null
      editingRect: null
      currentTag: null
      tagStore: []
      rectStore: []
      initialRectStore: []
      imageBaseURL: null
      scaleFactor: null
      windowWidth: window.innerWidth
    }

  selectAnnotation: (i)=> =>
    @updateState {editingRect: {$set: i}}

  scaledSize: =>
    {currentImage, scaleFactor} = @state
    return null unless currentImage?
    scaleFactor ?= 1
    {height, width} = currentImage
    height /= scaleFactor
    width /= scaleFactor
    return {width,height}

  renderImageContainer: =>
    {editingEnabled} = @props
    {currentImage, editingRect, scaleFactor
      rectStore, tagStore, currentTag, lockedTags} = @state
    return null unless currentImage?
    style = @scaledSize()
    onClick = @createAnnotation

    actions = do => {selectAnnotation} = @

    h 'div.image-container', {style}, [
      h 'img', {src: @imageURL(currentImage), style...}
      h Overlay, {
        style...
        editingEnabled: false
        scaleFactor
        image_tags: rectStore
        tags: tagStore
        lockedTags
        currentTag
        actions
      }
    ]

  renderImageLink: =>
    {permalinkRoute, initialImage} = @props
    {currentImage} = @state
    return null unless currentImage?
    {image_id} = currentImage
    className = "bp3-button bp3-icon-bookmark"
    text = "Permalink"

    if image_id == initialImage
      # We are at a permalink right now
      className += " bp3-disabled"
      text = h [h('span', [text, " to image "]), h('code', image_id)]
    h Link, {to: "#{permalinkRoute}/#{image_id}", className}, text

  renderNextImageButton: =>
    {navigationEnabled} = @props
    return null unless navigationEnabled
    h Button, {
      intent: Intent.PRIMARY, text: "Next image",
      rightIcon: 'chevron-right'
      onClick: @getImageToDisplay
    }

  displayKeyboardShortcuts: =>
    # Blueprint doesn't allow us to show keyboard shortcuts programmatically
    # without simulating the keycode. Wait for resolution of
    # https://github.com/palantir/blueprint/issues/1590
    @setState {infoDialogIsOpen: false}
    document.dispatchEvent(new KeyboardEvent('keydown', {
      which: 47, keyCode: 47, shiftKey: true, bubbles: true }))

  displayInfoBox: (isOpen)=> =>
    isOpen ?= true
    @setState {infoDialogIsOpen: isOpen}

  renderInfoDialog: =>
    {infoDialogIsOpen: isOpen} = @state
    {editingEnabled} = @props
    {displayKeyboardShortcuts} = @
    h InfoDialog, {isOpen, onClose: @displayInfoBox(false), editingEnabled, displayKeyboardShortcuts}

  render: ->
    h 'div.main', [
      h Navbar, {fixedToTop: true}, [
        h Navbar.Group, [
          h Navbar.Heading, null,  (
            h 'a', {href: '/'}, [
              h 'h1', "COSMOS"
            ]
          )
          h Navbar.Heading, {className: 'subtitle'}, 'Model Results'
          h Button, {
            icon: 'info-sign'
            onClick: @displayInfoBox()
          }, "Usage"
        ]
        h Navbar.Group, {align: Alignment.RIGHT}, [
          @renderImageLink()
          @renderNextImageButton()
        ]
      ]
      @renderImageContainer()
      @renderInfoDialog()
    ]

  saveData: =>
    {currentImage, rectStore} = @state
    {extraSaveData} = @props
    extraSaveData ?= {}

    saveItem = {
      tags: rectStore
      extraSaveData...
    }

    try
      newData = await @context.saveData(currentImage, saveItem)
      @updateState {
        rectStore: {$set: newData}
        initialRectStore: {$set: newData}
      }
      return true
    catch err
      console.log "Save rejected"
      console.log err
      return false

  setupTags: (data)=>

    cscale = chroma.scale('viridis')
      .colors(data.length)

    tags = [{
        tag_id: "phrase"
        name: "Phrase"
        color: "#fca"
      }, {
        tag_id: "sentence"
        name: "Sentence"
        color: "#acf"
      }, {
        tag_id: "equation"
        name: "Equation"
        color: "#f22"
      }, {
        tag_id: "variable"
        name: "Variable"
        color: "#41f"
      }]

    @setState {
      tagStore: tags
      currentTag: tags[0].tag_id
    }

  imageURL: (image)=>
    {imageBaseURL} = @props
    imageBaseURL ?= ""
    return imageBaseURL + image.file_path

  ensureImageDimensions: ({width, height, rest...})=>
    # Make sure we have image dimensions set before loading an image
    # into the UI
    imageURL = @imageURL(rest)
    new Promise (resolve, reject)->
      if width? and height?
        resolve({width, height, rest...})
        return
      img = new Image()
      img.onload = ->
        {width, height} = @
        resolve({width,height, rest...})
      img.src = imageURL

  getImageToDisplay: =>
    {nextImageEndpoint: imageToDisplay, imageRoute, initialImage} = @props
    {currentImage} = @state
    if initialImage and not currentImage?
      imageToDisplay = "#{imageRoute}/#{initialImage}"
    # We are loading an image and
    return unless imageToDisplay?
    console.log "Getting image from endpoint #{imageToDisplay}"
    @context.get(imageToDisplay)
      .then @onImageLoaded

  onImageLoaded: (d)=>
    if Array.isArray(d) and d.length == 1
      # API returns a single-item array
      d = d[0]
    d = await @ensureImageDimensions(d)

    rectStore = []
    @setState {
      currentImage: d
      rectStore
      initialRectStore: rectStore
    }
    AppToaster.show {
      message: h 'div', [
        "Loaded image "
        h "code", d.image_id
        "."
      ]
      intent: Intent.PRIMARY
      timeout: 2000
    }

  componentDidMount: ->
    @setupTags()
    @getImageToDisplay()

    window.addEventListener 'resize', =>
      @setState {windowWidth: window.innerWidth}

  didUpdateImage: (prevProps, prevState)->
    {currentImage} = @state
    # This supports flipping between images and predicted images
    {imageRoute} = @props
    imageRoute ?= '/image'
    return if prevState.currentImage == currentImage
    return unless currentImage?
    {image_id} = @state.currentImage

    image_tags = []
    for route in ["phrases","equations","variables"]
      t = await @context.get "#{imageRoute}/#{image_id}/#{route}"
      image_tags = image_tags.concat(t)

    @setState {rectStore: image_tags, initialRectStore: image_tags}

  didUpdateWindowSize: (prevProps, prevState)->
    {windowWidth, scaleFactor, currentImage} = @state
    return if scaleFactor? and prevState.windowWidth == windowWidth
    return unless currentImage?
    {width} = currentImage
    targetSize = Math.min 2000, windowWidth-24
    # Clamp to integer scalings for simplicity
    scaleFactor = width/targetSize
    if scaleFactor < 1
      scaleFactor = 1

    @setState {scaleFactor}

  componentDidUpdate: ->
    @didUpdateImage.apply(@,arguments)
    @didUpdateWindowSize.apply(@,arguments)

class ResultsPage extends Component
  render: ->
    h ResultsPageInner, {
      editingEnabled: false
      nextImageEndpoint: '/image/next_prediction'
      subtitleText: "View results"
      permalinkRoute: "/view-results"
      navigationEnabled: true
      @props...
    }

export {ResultsPage}
