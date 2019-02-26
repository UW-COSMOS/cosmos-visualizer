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

import {StatefulComponent} from './util'
import {AppToaster} from './toaster'
import {Overlay} from './overlay'
import {APIContext} from './api'
import {InfoDialog} from './info-dialog'

# Updates props for a rectangle
# from API signature to our internal signature
# TODO: make handle multiple boxes
class UIMain extends StatefulComponent
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

  updateAnnotation: (i)=>(updateSpec)=>
    spec = {rectStore: {[i]: updateSpec}}
    if updateSpec.tag_id?
      spec.currentTag = updateSpec.tag_id
    @updateState spec

  addLink: (i)=> =>
    # Add a link to another annotation
    {editingRect, rectStore} = @state
    {image_tag_id} = rectStore[i]
    if not editingRect?
      throw "Annotation must be selected to add a link"
    if editingRect == i
      throw "Cannot create self-referential link"
    spec = {
      rectStore: {[editingRect]: {linked_to: {$set: image_tag_id}}}
    }
    @updateState spec

  deleteAnnotation: (i)=> =>
    {rectStore, editingRect} = @state
    spec = {
      rectStore: {$splice: [[i,1]]}
    }
    if editingRect? and i == editingRect
      spec.editingRect = {$set: null}
    # Zero out links to this annotation
    {image_tag_id} = rectStore[editingRect]
    for rect,i in rectStore
      continue unless rect.linked_to == image_tag_id
      spec.rectStore[i] = {linked_to: {$set: null}}
    @updateState spec

  updateCurrentTag: (tag_id)=> =>
    @updateState {currentTag: {$set: tag_id}}

  selectAnnotation: (i)=> =>
    @updateState {editingRect: {$set: i}}

  appendAnnotation: (rect)=>
    return unless rect?
    {currentTag, rectStore} = @state
    rect.tag_id = currentTag
    # Create UUID on client side to allow
    # linking
    rect.image_tag_id = uuidv4()
    @updateState {
      rectStore: {$push: [rect]}
      editingRect: {$set: rectStore.length}
    }

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
      rectStore, tagStore, currentTag} = @state
    return null unless currentImage?
    style = @scaledSize()
    onClick = @createAnnotation

    actions = {
      deleteAnnotation: @deleteAnnotation
      updateAnnotation: @updateAnnotation
      selectAnnotation: @selectAnnotation
      appendAnnotation: @appendAnnotation
      updateState: @updateState
      updateCurrentTag: @updateCurrentTag
      addLink: @addLink
    }

    h 'div.image-container', {style}, [
      h 'img', {src: @imageURL(currentImage), style...}
      h Overlay, {
        style...
        editingRect
        editingEnabled
        scaleFactor
        image_tags: rectStore
        tags: tagStore
        currentTag
        actions
      }
    ]

  clearChanges: =>
    {initialRectStore} = @state
    @updateState {
      rectStore: {$set: initialRectStore}
      editingRect: {$set: null}
    }

  uiHasChanges: =>
    {rectStore, initialRectStore} = @state
    if initialRectStore.length == rectStore.length == 0
      return false
    return rectStore != initialRectStore

  renderSubtitle: =>
    {subtitleText} = @props
    return null if not subtitleText?
    return h Navbar.Heading, {className: 'subtitle'}, subtitleText

  renderPersistenceButtonArray: =>
    # Persist data to backend if editing is enabled
    return [] unless @props.editingEnabled
    {allowSaveWithoutChanges} = @props
    {rectStore, initialRectStore} = @state
    clearRectText = "Clear changes"
    if initialRectStore.length != 0
      clearRectText = "Reset changes"
    hasChanges = @uiHasChanges()
    return [
      h Button, {
        intent: Intent.SUCCESS, text: "Save",
        icon: 'floppy-disk',
        onClick: @saveData
        disabled: not hasChanges and not allowSaveWithoutChanges
      }
      h Button, {
        intent: Intent.DANGER, text: clearRectText,
        icon: 'trash', disabled: not hasChanges
        onClick: @clearChanges
      }]

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
    hasChanges = @uiHasChanges()
    h Button, {
      intent: Intent.PRIMARY, text: "Next image",
      rightIcon: 'chevron-right'
      disabled: hasChanges
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
              h 'h1', "Image tagger"
            ]
          )
          @renderSubtitle()
          h Button, {
            icon: 'info-sign'
            onClick: @displayInfoBox()
          }, "Usage"
        ]
        h Navbar.Group, {align: Alignment.RIGHT}, [
          @renderImageLink()
          h ButtonGroup, [
            @renderPersistenceButtonArray()...
            @renderNextImageButton()
          ]
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

    tags = data.map (d, ix)->
      {tag_id, color, name} = d

      if not name?
        name = tag_id.replace "-", " "
        name = name.charAt(0).toUpperCase()+name.slice(1)
      color ?= cscale[ix]
      {tag_id, color, name}

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
    @context.get("/tags/all")
      .then @setupTags
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
    image_tags = await @context.get "#{imageRoute}/#{image_id}/tags?validated=false"
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

export {UIMain}
