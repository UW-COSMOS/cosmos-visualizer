import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import update from 'immutability-helper'
import {select} from 'd3-selection'
import {findDOMNode} from 'react-dom'
import 'd3-jetpack'
import chroma from 'chroma-js'
import {Navbar, Button, ButtonGroup
        Intent, Alignment, Text} from "@blueprintjs/core"

import {AppToaster} from './toaster'
import {Overlay} from './overlay'
import {APIContext} from './api'

class App extends Component
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      currentImage: null
      editingRect: null
      currentTag: null
      saved: true
      tagStore: []
      rectStore: []
      initialRectStore: []
      imageBaseURL: null
      scaleFactor: null
      windowWidth: window.innerWidth
    }

  updateRectangle: (i)=>(rect)=>
    rect.tag ?= null
    spec = {
      rectStore: {$splice: [[i,1,rect]]}
    }
    if rect.tag? and rect.tag != @state.currentTag
      spec.currentTag = {$set: rect.tag}
    @updateState spec

  deleteRectangle: (i)=> =>
    {editingRect} = @state
    spec = {
      rectStore: {$splice: [[i,1]]}
    }
    if editingRect? and i == editingRect
      spec.editingRect = {$set: null}
    @updateState spec

  selectRectangle: (i)=> =>
    @updateState {editingRect: {$set: i}}

  appendRectangle: (rect)=>
    return unless rect?
    {currentTag, rectStore} = @state
    rect.tag = currentTag
    @updateState {
      rectStore: {$push: [rect]}
      editingRect: {$set: rectStore.length}
    }

  updateState: (spec)=>
    newState = update @state, spec
    @setState newState

  scaledSize: =>
    {currentImage, scaleFactor} = @state
    return null unless currentImage?
    scaleFactor ?= 1
    {height, width} = currentImage
    height /= scaleFactor
    width /= scaleFactor
    return {width,height}

  renderImageContainer: =>
    {currentImage, editingRect, scaleFactor
      rectStore, tagStore, currentTag} = @state
    return null unless currentImage?
    style = @scaledSize()
    onClick = @createRectangle
    h 'div.image-container', {style}, [
      h 'img', {src: @imageURL(currentImage), style...}
      h Overlay, {
        style...
        editingRect
        scaleFactor
        rectangles: rectStore
        tags: tagStore
        currentTag
        actions: {
          deleteRectangle: @deleteRectangle
          updateRectangle: @updateRectangle
          selectRectangle: @selectRectangle
          appendRectangle: @appendRectangle
          updateState: @updateState
        }
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
      return true
    return rectStore == initialRectStore

  render: ->
    {rectStore, initialRectStore} = @state
    clearRectText = "Clear changes"
    if initialRectStore.length != 0
      clearRectText = "Reset changes"

    h 'div.main', [
      h Navbar, {fixedToTop: true}, [
        h Navbar.Group, [
          h Navbar.Heading, "Image tagger"
          h Text, {className: "instructions"}, "Click + drag to create item. Click existing item to adjust."
        ]
        h Navbar.Group, {align: Alignment.RIGHT}, [
          h ButtonGroup, [
            h Button, {
              intent: Intent.SUCCESS, text: "Save",
              icon: 'floppy-disk', disabled: @uiHasChanges()
              onClick: @saveData
            }
            h Button, {
              intent: Intent.DANGER, text: clearRectText,
              icon: 'trash', disabled: @uiHasChanges()
              onClick: @clearChanges
            }
            h Button, {
              intent: Intent.PRIMARY, text: "Next image",
              rightIcon: 'chevron-right'
              disabled: not @uiHasChanges()
              onClick: @getNextImage
            }
          ]
        ]
      ]
      @renderImageContainer()
    ]

  saveData: =>
    {currentImage, rectStore} = @state
    try
      await @context.saveData(currentImage, rectStore)
      @updateState {
        initialRectStore: {$set: rectStore}
      }
      return true
    catch err
      console.log "Save rejected"
      return false

  setupTags: (data)=>

    cscale = chroma.scale('RdYlBu')
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

  getNextImage: =>
    @context.get("/image/next")
      .then @onImageLoaded

  onImageLoaded: (d)=>
    if Array.isArray(d) and d.length == 1
      # API returns a unit-length array
      d = d[0]

    d = await @ensureImageDimensions(d)

    rectStore = []
    @setState {
      currentImage: d
      rectStore
      initialRectStore: rectStore
      saved: false
    }
    AppToaster.show {
      message: h 'div', [
        "Loaded image "
        h "code", d.image_id
        "."
      ]
      intent: Intent.PRIMARY
    }

  componentDidMount: ->
    @context.get("/tags/all")
      .then @setupTags
    @getNextImage()

    window.addEventListener 'resize', =>
      @setState {windowWidth: window.innerWidth}

  didUpdateImage: (prevProps, prevState)->
    {currentImage} = @state
    return if prevState.currentImage == currentImage
    return unless currentImage?
    {image_id} = @state.currentImage
    d = await @context.get "/image/#{image_id}/tags"
    @setState {rectStore: d, initRectStore: d, saved: true}

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

export {App}
