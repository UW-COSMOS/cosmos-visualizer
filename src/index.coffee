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

  renderImageContainer: ->
    {currentImage, editingRect, rectStore, tagStore, currentTag} = @state
    return null unless currentImage?
    {url, height, width } = currentImage
    style = {width, height}
    onClick = @createRectangle
    h 'div.image-container', {style}, [
      h 'img', {src: url, style...}
      h Overlay, {
        width,
        height,
        editingRect
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

  render: ->
    {saved} = @state
    h 'div.main', [
      h Navbar, [
        h Navbar.Group, [
          h Navbar.Heading, "Image tagger"
          h "span.instructions", "Click + drag to create item. Click existing item to adjust."
        ]
        h Navbar.Group, {align: Alignment.RIGHT}, [
          h ButtonGroup, [
            h Button, {intent: Intent.SUCCESS, text: "Save", icon: 'floppy-disk', disabled: saved}
            h Button, {intent: Intent.PRIMARY, text: "Next image", rightIcon: 'chevron-right'}
          ]
        ]
      ]
      @renderImageContainer()
    ]

  setupTags: (data)=>

    cscale = chroma.scale('RdYlBu')
      .colors(data.length)

    tags = data.map (d, ix)->
      {id, color, name} = d

      name ?= id.replace /\b\w/g, (l)->l.toUpperCase()
                .replace /\-\_/g, " "
      color ?= cscale[ix]
      {id, color, name}

    @setState {
      tagStore: tags
      currentTag: tags[0].id
    }

  getNextImage: =>
    @context.get("/image")
      .then (d)=>@setState {currentImage: d}

  componentDidMount: ->
    @context.get("/tags")
      .then @setupTags
    @getNextImage()

  componentDidUpdate: (prevProps, prevState)->
    {currentImage} = @state
    return if prevState.currentImage == currentImage
    return unless currentImage?
    {id} = @state.currentImage
    @context.get("/image/#{id}/tags")
      .then (d)=>@setState {rectStore: d}


App = (props)=>
  {baseURL, rest...} = props
  h APIProvider, {baseURL}, [
    h AppMain, rest
  ]

el = document.getElementById('app')
render h(App), el
