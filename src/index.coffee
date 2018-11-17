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
      possibleTags: null
      tagData: null
      isEditing: false
    }

  render: ->
    {currentImage} = @state
    return null unless currentImage?
    {url, height, width } = currentImage
    style = {width, height}
    h 'div.image-container', {style}, [
      h 'img', {src: url, style...}
      h 'div.overlay', {style}, [
        h DragRect, {
          x: 50, y: 30, width: 100,
          height: 500, color: 'rgba(255,0,0,0.5)'}
      ]
    ]

  componentDidMount: ->
    currentImage = await @context.get "/image"
    @setState {currentImage}

App = (props)=>
  {baseURL, rest...} = props
  h APIProvider, {baseURL}, [
    h AppMain, rest
  ]

el = document.getElementById('app')
render h(App), el
