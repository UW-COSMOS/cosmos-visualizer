import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import {select} from 'd3-selection'
import uuidv4 from 'uuid/v4'
import {findDOMNode} from 'react-dom'
import 'd3-jetpack'
import chroma from 'chroma-js'
import {Link, withRouter} from 'react-router-dom'
import {Navbar, Button, ButtonGroup
        Intent, Alignment, Text, Icon} from "@blueprintjs/core"

import {StatefulComponent, LinkButton} from '@macrostrat/ui-components'
import {PageHeader, PermalinkButton} from '../util'
import {AppToaster} from '../toaster'
import {APIContext} from '../api'
import {InfoDialog} from '../info-dialog'
import {ImageContainer} from '../image-container'

ExtractionsButton = ({image})=>
  return null unless image?
  h LinkButton, {
    to: "/view-extractions/#{image.image_id}"
    disabled: not image?
    text: "View tag extractions"
  }

# Updates props for a rectangle
# from API signature to our internal signature
# TODO: make handle multiple boxes
class ResultsPage extends StatefulComponent
  @defaultProps: {
    allowSaveWithoutChanges: false
    editingEnabled: true
    navigationEnabled: true
    imageRoute: '/image'
    apiRoutes: ["phrases","equations","variables"]
  }
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      infoDialogIsOpen: false
      currentImage: null
      editingRect: null
      currentTag: null
      tagStore: []
      rectStore: []
      initialRectStore: []
      imageBaseURL: null
    }

  selectAnnotation: (i)=> =>
    @updateState {editingRect: {$set: i}}

  renderImageContainer: =>
    {currentImage, rectStore, tagStore, currentTag, lockedTags} = @state

    actions = do => {selectAnnotation} = @

    h ImageContainer, {
      image: currentImage
      imageTags: rectStore
      tags: tagStore
      editingEnabled: false
      lockedTags
      currentTag
      actions
    }

  renderNextImageButton: =>
    {navigationEnabled} = @props
    return null unless navigationEnabled
    h Button, {
      intent: Intent.PRIMARY, text: "Next image",
      rightIcon: 'chevron-right'
      onClick: @getImageToDisplay
    }

  displayKeyboardShortcuts: =>
    # Blueprint doesn't allow us to show keyboard shortcuts programmatically
    # without simulating the keycode. Wait for resolution of
    # https://github.com/palantir/blueprint/issues/1590
    @setState {infoDialogIsOpen: false}
    document.dispatchEvent(new KeyboardEvent('keydown', {
      which: 47, keyCode: 47, shiftKey: true, bubbles: true }))

  displayInfoBox: (isOpen)=> =>
    isOpen ?= true
    @setState {infoDialogIsOpen: isOpen}

  renderInfoDialog: =>
    {infoDialogIsOpen: isOpen} = @state
    {editingEnabled} = @props
    {displayKeyboardShortcuts} = @
    h InfoDialog, {isOpen, onClose: @displayInfoBox(false), editingEnabled, displayKeyboardShortcuts}

  render: ->
    {subtitleText, permalinkRoute} = @props
    {currentImage: image} = @state
    h 'div.main', [
      h Navbar, {fixedToTop: true}, [
        h PageHeader, {subtitle: subtitleText}, [
          h Button, {
            icon: 'info-sign'
            onClick: @displayInfoBox()
          }, "Usage"
        ]
        h Navbar.Group, {align: Alignment.RIGHT}, [
          h ExtractionsButton, {image}
          h PermalinkButton, {permalinkRoute, image}
          @renderNextImageButton()
        ]
      ]
      @renderImageContainer()
      @renderInfoDialog()
    ]

  setupTags: (data)=>

    tags = [{
        tag_id: "phrase"
        name: "Phrase"
        color: "#fca"
      }, {
        tag_id: "sentence"
        name: "Sentence"
        color: "#acf"
      }, {
        tag_id: "equation"
        name: "Equation"
        color: "#f22"
      }, {
        tag_id: "variable"
        name: "Variable"
        color: "#41f"
      }]

    @setState {
      tagStore: tags
      currentTag: tags[0].tag_id
    }

  getImageToDisplay: =>
    {nextImageEndpoint: imageToDisplay, imageRoute, initialImage} = @props
    {currentImage} = @state
    if initialImage and not currentImage?
      imageToDisplay = "#{imageRoute}/#{initialImage}"
    # We are loading an image and
    return unless imageToDisplay?
    console.log "Getting image from endpoint #{imageToDisplay}"
    @context.get(imageToDisplay)
      .then @onImageLoaded

  onImageLoaded: (d)=>
    if Array.isArray(d) and d.length == 1
      # API returns a single-item array
      d = d[0]

    rectStore = []
    @setState {
      currentImage: d
      rectStore
      initialRectStore: rectStore
    }
    AppToaster.show {
      message: h 'div', [
        "Loaded image "
        h "code", d.image_id
        "."
      ]
      intent: Intent.PRIMARY
      timeout: 1000
    }

  componentDidMount: ->
    @setupTags()
    @getImageToDisplay()

    window.addEventListener 'resize', =>
      @setState {windowWidth: window.innerWidth}

  didUpdateImage: (prevProps, prevState)->
    {currentImage} = @state
    # This supports flipping between images and predicted images
    {imageRoute} = @props
    imageRoute ?= '/image'
    return if prevState.currentImage == currentImage
    return unless currentImage?
    {image_id} = @state.currentImage

    image_tags = []
    for route in @props.apiRoutes
      t = await @context.get "#{imageRoute}/#{image_id}/#{route}"
      continue unless t?
      image_tags = image_tags.concat(t)

    @setState {rectStore: image_tags, initialRectStore: image_tags}

  componentDidUpdate: ->
    @didUpdateImage.apply(@,arguments)

export {ResultsPage}
