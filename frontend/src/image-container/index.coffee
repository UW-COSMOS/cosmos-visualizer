import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {join} from 'path'

import {ImageOverlay} from '../image-overlay'
import {APIContext} from '../api'
import {PageExtractionShape} from '../types'

ImageStoreContext = createContext({})

class ImageStoreProvider extends Component
  render: ->
    {baseURL, publicURL, children} = @props
    if not baseURL?
      throw "baseURL for image store must be set in context"
    value = {baseURL, publicURL}
    h ImageStoreContext.Provider, {value}, children

class ImageContainer extends Component
  @defaultProps: {
    actions: {}
    tags: []
    image: null
    editingEnabled: false
  }
  @contextType: ImageStoreContext
  @propTypes: {
    image: PageExtractionShape
  }

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
    return if nextProps.image._id == oldId
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
    {resize_bytes} = image
    return "data:image/png;base64," + resize_bytes

  render: =>
    {actions, editingEnabled, editingRect,
     tags, currentTag, imageTags, rest...} = @props
    {scaleFactor, image} = @state
    return null unless image?
    style = @scaledSize()

    h 'div.image-container', {style}, [
      h 'img', {src: @imageURL(image), style...}
      #h ImageOverlay, {
        #style...
        #scaleFactor
        #image_tags: imageTags
        #currentTag
        #tags
        #actions
        #editingEnabled
        #editingRect
      #}
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

  componentDidMount: ->
    window.addEventListener 'resize', =>
      @setState {windowWidth: window.innerWidth}

  componentDidUpdate: ->
    @didUpdateWindowSize.apply(@,arguments)

export {ImageContainer, ImageStoreContext, ImageStoreProvider}
