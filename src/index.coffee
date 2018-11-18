import 'babel-polyfill' # Helps with building
import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'

import {APIProvider, APIContext} from './api'
import {DragRect} from './drag-rect'
import './main.styl'

class AppMain extends Component
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      currentImage: null
      tagStore: []
      rectStore: []
      isEditing: false
      editingRect: {
        x: 50, y: 30,
        width: 100
        height: 500
      }
    }

  updateRect: (pos)=>
    @setState {editingRect: pos}

  render: ->
    {currentImage, editingRect, rectStore} = @state
    return null unless currentImage?
    {url, height, width } = currentImage
    style = {width, height}
    h 'div.image-container', {style}, [
      h 'img', {src: url, style...}
      h 'div.overlay', {style}, rectStore.map (d, ix)=>
        h DragRect, {
          key: ix
          updateRect: @updateRect
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
