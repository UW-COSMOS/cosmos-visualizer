import 'babel-polyfill' # Helps with building
import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import update from 'immutability-helper'
import {select} from 'd3-selection'
import {findDOMNode} from 'react-dom'
import 'd3-jetpack'
import chroma from 'chroma-js'
import {FocusStyleManager, Navbar, Button, ButtonGroup
        Intent, Alignment} from "@blueprintjs/core"

import "@blueprintjs/core/lib/css/blueprint.css"
import "@blueprintjs/icons/lib/css/blueprint-icons.css"
import "@blueprintjs/select/lib/css/blueprint-select.css"

import {AppToaster} from './toaster'
import {Overlay} from './overlay'
import {APIProvider, APIContext} from './api'
import './main.styl'

FocusStyleManager.onlyShowFocusOnTabs()

class AppMain extends Component
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
      imageBaseURL: null
      scaleFactor: null
      windowWidth: window.innerWidth
    }

  updateRectangle: (i)=>(rect)=>
    rect.tag ?= null
    spec = {
      rectStore: {$splice: [[i,1,rect]]}
      saved: {$set: false}
    }
    if rect.tag? and rect.tag != @state.currentTag
      spec.currentTag = {$set: rect.tag}
    @updateState spec

  deleteRectangle: (i)=> =>
    {editingRect} = @state
    spec = {
      rectStore: {$splice: [[i,1]]}
      saved: {$set: false}
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
      saved: {$set: false}
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

  clearAnnotations: =>
    @updateState {
      rectStore: {$set: []}
      editingRect: {$set: null}
      saved: {$set: true}
    }

  render: ->
    {saved, rectStore} = @state
    h 'div.main', [
      h Navbar, {fixedToTop: true}, [
        h Navbar.Group, [
          h Navbar.Heading, "Image tagger"
          h "span.instructions", "Click + drag to create item. Click existing item to adjust."
        ]
        h Navbar.Group, {align: Alignment.RIGHT}, [
          h ButtonGroup, [
            h Button, {
              intent: Intent.SUCCESS, text: "Save",
              icon: 'floppy-disk', disabled: saved
              onClick: @saveData
            }
            h Button, {
              intent: Intent.DANGER, text: "Clear annotations",
              icon: 'trash', disabled: rectStore.length == 0
              onClick: @clearAnnotations
            }
            h Button, {
              intent: Intent.PRIMARY, text: "Next image",
              rightIcon: 'chevron-right'
              disabled: not saved
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
      @updateState {saved: {$set: true}}
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

    console.log d
    @setState {
      currentImage: d
      rectStore: []
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
    @context.get("/image/#{image_id}/tags")
      .then (d)=>@setState {rectStore: d, saved: true}

  didUpdateWindowSize: (prevProps, prevState)->
    {windowWidth, scaleFactor, currentImage} = @state
    return if scaleFactor? and prevState.windowWidth == windowWidth
    return unless currentImage?
    {width} = currentImage
    scaleFactor = Math.ceil(width/windowWidth)
    @setState {scaleFactor}

  componentDidUpdate: ->
    @didUpdateImage.apply(@,arguments)
    @didUpdateWindowSize.apply(@,arguments)

App = (props)=>
  {baseURL, rest...} = props
  h APIProvider, {baseURL}, [
    h AppMain, rest
  ]

window.createUI = (opts={})->
  {baseURL, imageBaseURL} = opts
  el = document.getElementById('app')
  __ = h App, {baseURL, imageBaseURL}
  render __, el
