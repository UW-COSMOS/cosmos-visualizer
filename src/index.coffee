import 'babel-polyfill' # Helps with building
import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import update from 'immutability-helper'
import {select} from 'd3-selection'
import {findDOMNode} from 'react-dom'
import 'd3-jetpack'

import {Overlay} from './overlay'
import {APIProvider, APIContext} from './api'
import './main.styl'

class AppMain extends Component
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      currentImage: null
      editingRect: null
      tagStore: []
      rectStore: []
    }

  updateRectangle: (i)=>(pos)=>
    @updateState {rectStore: {$splice: [
      [i,1,pos]
    ]}}

  createRectangle: (e)=>
    {clientX: x, clientY: y} = e

    console.log {x,y}
    el = select findDOMNode @
    div = el.append 'div.rect'
      .at {top:x,left:y,width:100,height:100}

  selectRectangle: (i)=> =>
    @setState {editingRect: i}

  addRectangle: (rect)=>
    @updateState {rectStore: {$push: rect}}

  updateState: (spec)->
    newState = update @state, spec
    @setState newState

  render: ->
    {currentImage, editingRect, rectStore} = @state
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
        actions: {
          updateRectangle: @updateRectangle
          selectRectangle: @selectRectangle
          addRectangle: @addRectangles
        }
      }
    ]

  componentDidMount: ->
    @context.get("/tags")
      .then (d)=>@setState {tagStore: d}

    @context.get("/image")
      .then (d)=>@setState {currentImage: d}

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
