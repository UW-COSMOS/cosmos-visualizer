import 'babel-polyfill' # Helps with building
import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import update from 'immutability-helper'

import {APIProvider, APIContext} from './api'
import {DragRectangle, Rectangle} from './drag-rect'
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

  selectRectangle: (i)=> =>
    @setState {editingRect: i}

  updateState: (spec)->
    newState = update @state, spec
    @setState newState

  render: ->
    {currentImage, editingRect, rectStore} = @state
    return null unless currentImage?
    {url, height, width } = currentImage
    style = {width, height}
    h 'div.image-container', {style}, [
      h 'img', {src: url, style...}
      h 'div.overlay', {style}, rectStore.map (d, ix)=>
        Rect = if ix == editingRect then DragRectangle else Rectangle
        h Rect, {
          key: ix
          updateRect: @updateRectangle(ix)
          onClick: @selectRectangle(ix)
          d...
          color: 'rgba(255,0,0,0.5)'
          maxPosition: style
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
