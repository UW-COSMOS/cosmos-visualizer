import {Component, createContext} from 'react'
import h from 'react-hyperscript'
import uuidv4 from 'uuid/v4'
import {findDOMNode} from 'react-dom'
import 'd3-jetpack'
import chroma from 'chroma-js'
import {Link} from 'react-router-dom'
import {Navbar, Button, ButtonGroup
        Intent, Alignment, Text, Icon} from "@blueprintjs/core"
import T from 'prop-types'

import {StatefulComponent} from '@macrostrat/ui-components'
import {PermalinkButton} from '../permalinks'
import {PageHeader} from '../util'
import {AppToaster} from '../toaster'
import {APIContext, ErrorMessage} from '../api'
import {InfoDialog} from '../info-dialog'
import {ImageContainer} from '../image-container'


# Updates props for a rectangle
# from API signature to our internal signature
# TODO: make handle multiple boxes
class TaggingPage extends StatefulComponent
  @defaultProps: {
    allowSaveWithoutChanges: false
    editingEnabled: true
    navigationEnabled: true
    imageRoute: '/image'
  }
  @propTypes: {
    stack_id: T.string
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
      lockedTags: new Set()
    }

  updateAnnotation: (i)=>(updateSpec)=>
    spec = {rectStore: {[i]: updateSpec}}
    if updateSpec.tag_id?
      spec.currentTag = updateSpec.tag_id
    @updateState spec

  addLink: (i)=> =>
    # Add a link to another annotation
    {editingRect, rectStore} = @state
    {image_tag_id} = rectStore[i]
    if not editingRect?
      throw "Annotation must be selected to add a link"
    if editingRect == i
      throw "Cannot create self-referential link"
    spec = {
      rectStore: {[editingRect]: {linked_to: {$set: image_tag_id}}}
    }
    @updateState spec

  deleteAnnotation: (i)=> =>
    {rectStore, editingRect} = @state
    spec = {
      rectStore: {$splice: [[i,1]]}
    }
    if editingRect? and i == editingRect
      spec.editingRect = {$set: null}
    # Zero out links to this annotation
    {image_tag_id} = rectStore[editingRect]
    for rect,i in rectStore
      continue unless rect.linked_to == image_tag_id
      spec.rectStore[i] = {linked_to: {$set: null}}
    @updateState spec

  updateCurrentTag: (tag_id)=> =>
    console.log "Current tag: #{tag_id}"
    @updateState {currentTag: {$set: tag_id}}

  selectAnnotation: (i)=> =>
    console.log "Selecting annotation #{i}"
    @updateState {editingRect: {$set: i}}

  appendAnnotation: (rect)=>
    return unless rect?
    {currentTag, rectStore} = @state
    rect.tag_id = currentTag
    # Create UUID on client side to allow
    # linking
    rect.image_tag_id = uuidv4()
    @updateState {
      rectStore: {$push: [rect]}
      editingRect: {$set: rectStore.length}
    }

  renderImageContainer: =>
    {editingEnabled} = @props
    {currentImage, editingRect
      rectStore, tagStore, currentTag, lockedTags} = @state
    return null unless currentImage?

    actions = do =>
      {deleteAnnotation,
       updateAnnotation,
       selectAnnotation,
       appendAnnotation,
       updateCurrentTag,
       toggleTagLock,
       updateState,
       addLink} = @

    h ImageContainer, {
      editingRect
      editingEnabled
      image: currentImage
      imageTags: rectStore
      tags: tagStore
      lockedTags
      currentTag
      actions
    }

  toggleTagLock: (tagId)=> =>
    {tagStore, currentTag, lockedTags} = @state

    if lockedTags.has(tagId)
      lockedTags.delete(tagId)
    else
      lockedTags.add(tagId)

    # Check if locked and then get next unlocked tag
    ix = tagStore.findIndex (d)-> d.tag_id==currentTag
    forward = true
    while lockedTags.has(tagStore[ix].tag_id)
      ix += if forward then 1 else -1
      if ix > tagStore.length-1
        forward = false
        ix -= 1
      if ix < 0
        forward = true

    nextTag = tagStore[ix].tag_id
    spec = {lockedTags: {$set: lockedTags}}
    if nextTag != currentTag
      spec.currentTag = {$set: nextTag}
    @updateState spec

  clearChanges: =>
    {initialRectStore} = @state
    @updateState {
      rectStore: {$set: initialRectStore}
      editingRect: {$set: null}
    }

  uiHasChanges: =>
    {rectStore, initialRectStore} = @state
    if initialRectStore.length == rectStore.length == 0
      return false
    return rectStore != initialRectStore

  renderPersistenceButtonArray: =>
    # Persist data to backend if editing is enabled
    return [] unless @props.editingEnabled
    {allowSaveWithoutChanges} = @props
    {rectStore, initialRectStore} = @state
    clearRectText = "Clear changes"
    if initialRectStore.length != 0
      clearRectText = "Reset changes"
    hasChanges = @uiHasChanges()
    return [
      h Button, {
        intent: Intent.SUCCESS, text: "Save",
        icon: 'floppy-disk',
        onClick: @saveData
        disabled: not hasChanges and not allowSaveWithoutChanges
      }
      h Button, {
        intent: Intent.DANGER, text: clearRectText,
        icon: 'trash', disabled: not hasChanges
        onClick: @clearChanges
      }]

  renderNextImageButton: =>
    {navigationEnabled} = @props
    return null unless navigationEnabled
    hasChanges = @uiHasChanges()
    h Button, {
      intent: Intent.PRIMARY, text: "Next image",
      rightIcon: 'chevron-right'
      disabled: hasChanges
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
    h InfoDialog, {
      isOpen
      onClose: @displayInfoBox(false)
      editingEnabled
      displayKeyboardShortcuts
    }

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
          h PermalinkButton, {permalinkRoute, image}
          h ButtonGroup, [
            @renderPersistenceButtonArray()...
            @renderNextImageButton()
          ]
        ]
      ]
      @renderImageContainer()
      @renderInfoDialog()
    ]

  currentStackID: =>
    return @state.currentImage.stack_id or @props.stack_id


  saveData: =>
    {currentImage, rectStore} = @state
    {extraSaveData} = @props
    extraSaveData ?= {}

    saveItem = {
      tags: rectStore
      extraSaveData...
    }

    stack_id = @currentStackID()

    endpoint = "/image/#{currentImage.image_id}/#{stack_id}/tags"

    try
      newData = await @context.post(endpoint, saveItem, {
        handleError: false
      })
      AppToaster.show {
        message: "Saved data!"
        intent: Intent.SUCCESS
      }
      @updateState {
        rectStore: {$set: newData}
        initialRectStore: {$set: newData}
      }
      return true
    catch err
      AppToaster.show ErrorMessage {
        title: "Could not save tags"
        method: 'POST'
        endpoint: endpoint
        error: err.toString()
        data: saveItem
      }
      console.log "Save rejected"
      console.log err
      return false

  setupTags: (data)=>

    cscale = chroma.scale('viridis')
      .colors(data.length)

    tags = data.map (d, ix)->
      {tag_id, color, name} = d

      if not name?
        name = tag_id.replace "-", " "
        name = name.charAt(0).toUpperCase()+name.slice(1)
      color ?= cscale[ix]
      {tag_id, color, name}

    @setState {
      tagStore: tags
      currentTag: tags[0].tag_id
    }

  getImageToDisplay: =>
    {nextImageEndpoint: imageToDisplay,
     imageRoute, initialImage, stack_id} = @props
    {currentImage} = @state
    if initialImage and not currentImage?
      imageToDisplay = "#{imageRoute}/#{initialImage}"
    # We are loading an image and
    return unless imageToDisplay?
    console.log "Getting image from endpoint #{imageToDisplay}"
    d = await @context.get(imageToDisplay, {stack_id}, {unwrapResponse: (res)->res.results})
    @onImageLoaded(d)

  onImageLoaded: (d)=>
    if Array.isArray(d) and d.length == 1
      # API returns a single-item array
      d = d[0]
    console.log d

    rectStore = []
    @setState {
      currentImage: d
      rectStore
      initialRectStore: rectStore
    }

    AppToaster.show {
      message: h 'div', [
        "Loaded image "
        h "code", d._id
        "."
      ]
      intent: Intent.PRIMARY
      timeout: 1000
    }

  componentDidMount: ->
    @context.get("/tags/all")
      .then @setupTags
    @getImageToDisplay()

  didUpdateImage: (prevProps, prevState)->
    {currentImage} = @state
    # This supports flipping between images and predicted images
    {imageRoute} = @props
    imageRoute ?= '/image'
    return if prevState.currentImage == currentImage
    return unless currentImage?
    {image_id} = @state.currentImage
    stack_id = @currentStackID()

    image_tags = []
    route = "tags"
    #t = await @context.get "#{imageRoute}/#{image_id}/#{stack_id}/#{route}", {validated: false}
    #image_tags = image_tags.concat(t)
    @setState {rectStore: image_tags, initialRectStore: image_tags}

  componentDidUpdate: ->
    @didUpdateImage.apply(@,arguments)

export {TaggingPage}
