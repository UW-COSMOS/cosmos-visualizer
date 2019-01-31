import {Component} from 'react'
import h from 'react-hyperscript'

import {HashRouter as Router, Route, Redirect, Switch} from 'react-router-dom'

import {APIContext} from './api'
import {UIMain} from './ui-main'
import {Role} from './enum'
import {LoginForm} from './login-form'

class App extends Component
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      people: null
      person: null
      role: null
    }

  allRequiredOptionsAreSet: =>
    {role, person} = @state
    return false unless role?
    return false if not person? and (role == Role.TAG or role == Role.VALIDATE)
    return true

  renderAction: ({match})=>
    {params: {role}} = match
    {person, role: stateRole} = @state
    isValid = (stateRole == role)
    if not isValid
      # We need to allow the user to change roles
      return h Redirect, {to: '/'}

    @renderUI(role, person)({match})

  renderUI: (role, person)=> ({match})=>

    imageRoute = "/image"
    id = null
    if person?
      id = person.person_id
    extraSaveData = null
    nextImageEndpoint = "/image/next"
    permalinkRoute = "/view-training"
    allowSaveWithoutChanges = false
    editingEnabled = true

    if role == Role.TAG and id?
      extraSaveData = {tagger: id}
      subtitleText = "Tag"
    else if role == Role.VALIDATE and id?
      extraSaveData = {validator: id}
      nextImageEndpoint = "/image/validate"
      # Tags can be validated even when unchanged
      allowSaveWithoutChanges = true
      subtitleText = "Validate"
    else if role == Role.VIEW_TRAINING
      editingEnabled = false
      nextImageEndpoint = "/image/validate"
      subtitleText = "View training data"
    else if role == Role.VIEW_RESULTS
      editingEnabled = false
      imageRoute = "/image_predictions"
      nextImageEndpoint = "/image_predictions/next"
      subtitleText = "View results"
      permalinkRoute = "/view-results"

    # Go to specific image by default, if set
    {params: {imageId}} = match
    # This is a hack to disable "NEXT" for now
    # on permalinked images
    navigationEnabled
    if imageId?
      navigationEnabled = false

    console.log "Setting up UI with role #{role}"
    console.log "Image id: #{imageId}"
    return h UIMain, {
      imageRoute
      extraSaveData
      permalinkRoute
      navigationEnabled
      nextImageEndpoint
      initialImage: imageId
      allowSaveWithoutChanges
      editingEnabled
      subtitleText
      @props...
    }

  renderLoginForm: =>
    {person, people, role} = @state
    return null unless people?
    if @allRequiredOptionsAreSet()
      return h Redirect, {to: "/action/#{role}"}
    h LoginForm, {
      person, people,
      setPerson: @setPerson
      setRole: @setRole
    }

  render: ->
    h Router, [
      h 'div.app-main', [
        h Switch, [
          h Route, {path: '/', exact: true, render: @renderLoginForm}
          # Legacy route for viewing training data
          h Route, {path: '/view/:imageId', render: @renderUI(Role.VIEW_TRAINING)}
          h Route, {path: '/view-training/:imageId', render: @renderUI(Role.VIEW_TRAINING)}
          h Route, {path: '/view-results/:imageId', render: @renderUI(Role.VIEW_RESULTS)}
          h Route, {path: '/action/:role', render: @renderAction}
        ]
      ]
    ]

  setupPeople: (d)=>
    @setState {people: d}

  setPerson: (item)=>
    {tagger, validator} = item
    tagger = tagger == 1
    validator = validator == 1
    role = null
    if tagger == 1 and validator != 1
      role = Role.TAG
    @setState {person: item, role}

  setRole: (role)=>
    @setState {role}

  componentDidMount: ->
    @context.get("/people/all")
      .then @setupPeople

export {App}
