import 'babel-polyfill' # Helps with building
import {json} from 'd3-fetch'
import {Component} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'

class App extends Component
  constructor: (props)->
    super props
    @state = {
      currentImage: null
      possibleTags: null
      tagData: null
      isEditing: false
    }

    @fetchData()

  fetchData: ->
    data = await json('/test/image.json')
    @setState {currentImage: data}
    console.log data

  render: ->
    {currentImage} = @state
    return null unless currentImage?
    {url, height, width } = currentImage
    console.log url
    h 'img', {src: url, width, height}

render h(App), document.getElementById('app')
