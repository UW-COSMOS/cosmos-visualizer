import 'babel-polyfill' # Helps with building
import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import {APIProvider, APIContext} from './api'
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
    h 'div.image-container', [
      h 'img', {src: url, width, height}
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
