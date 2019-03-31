import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {select} from 'd3-selection'
import {Overlay} from '../overlay'
import {APIContext} from '../api'

class ImageContainer extends Component
  @defaultProps: {
    actions: {}
    tags: []
    image: null
  }
  @contextType: APIContext

  constructor: (props)->
    super props
    @state = {
      scaleFactor: null
      image: null
      windowWidth: window.innerWidth
    }

  componentWillReceiveProps: (nextProps)->
    # Store prevUserId in state so we can compare when props change.
    # Clear out any previously-loaded user data (so we don't render stale stuff).
    {image} = nextProps
    try
      oldId = @state.image.image_id
    catch
      oldId = null

    return unless image?
    return if nextProps.image.image_id == oldId
    im =  await @ensureImageDimensions(image)
    @setState {image: im}

  scaledSize: =>
    {image, scaleFactor} = @state
    return null unless image?
    scaleFactor ?= 1
    {height, width} = image
    height /= scaleFactor
    width /= scaleFactor
    return {width,height}

  imageURL: (image)=>
    {imageBaseURL} = @context
    imageBaseURL ?= ""
    return imageBaseURL + image.file_path

  render: =>
    {actions, editingEnabled, image, tags, imageTags, rest...} = @props
    {scaleFactor} = @state
    return null unless image?
    style = @scaledSize()

    h 'div.image-container', {style}, [
      h 'img', {src: @imageURL(image), style...}
      h Overlay, {
        style...
        scaleFactor
        image_tags: imageTags
        tags
        actions
      }
    ]

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

  didUpdateWindowSize: (prevProps, prevState)->
    {windowWidth, scaleFactor, image} = @state
    return if scaleFactor? and prevState.windowWidth == windowWidth
    return unless image?
    {width} = image
    targetSize = Math.min 2000, windowWidth-24
    # Clamp to integer scalings for simplicity
    scaleFactor = width/targetSize
    if scaleFactor < 1
      scaleFactor = 1

    @setState {scaleFactor}

  componentDidUpdate: ->
    @didUpdateWindowSize.apply(@,arguments)

export {ImageContainer}
