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
    console.log @state
    return false unless @state.person?
    return false unless @state.role?
    return true

  renderUI: ({match})=>
    {params: {role}} = match
    {person, people, role: stateRole} = @state
    isValid = (stateRole == role)
    if not isValid
      # We need to allow the user to change roles
      return h Redirect, {to: '/'}

    imageRoute = "/image"
    id = person.person_id
    extraSaveData = null
    nextImageEndpoint = "/image/next"
    allowSaveWithoutChanges = false
    editingEnabled = true

    if role == Role.TAG
      extraSaveData = {tagger: id}
      subtitleText = "Tag"
    else if role == Role.VALIDATE
      extraSaveData = {validator: id}
      nextImageEndpoint = "/image/validate"
      # Tags can be validated even when unchanged
      allowSaveWithoutChanges = true
      subtitleText = "Validate"
    else if role == Role.VIEW_TRAINING
      editingEnabled = false
      nextImageEndpoint = "/image/validate"
      subtitleText = "View Training Data"
    else if role == Role.VIEW_RESULTS
      editingEnabled = false
      imageRoute = "/image_predictions"
      nextImageEndpoint = "/image_predictions/next"
      subtitleText = "View Results"

    console.log "Setting up UI with role #{role}"

    return h UIMain, {
      imageRoute
      extraSaveData
      nextImageEndpoint
      allowSaveWithoutChanges
      editingEnabled
      subtitleText
      @props...
    }

  renderViewerForTrainingImage: ({match})=>
    console.log "Render viewer for image"
    {params: {imageId}} = match
    console.log "Match", match
    return h UIMain, {
      editingEnabled: false
      navigationEnabled: false
      subtitleText: h ["View ", h('code',imageId)]
      initialImageEndpoint: "/image/#{imageId}"
      nextImageEndpoint: "image/next"
      imageId: imageId
      @props...
    }

  renderViewerForResultImage: ({match})=>
    console.log "Render viewer for image"
    {params: {imageId}} = match
    console.log "Match"
    baseRoute = "/image_predictions"
    return h UIMain, {
      editingEnabled: false
      navigationEnabled: false
      subtitleText: h ["View ", h('code',imageId)]
      baseRoute
      initialImageEndpoint: "#{baseRoute}/#{imageId}"
      nextImageEndpoint: "#{baseRoute}/next"
      imageId: imageId
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
          h Route, {path: '/view/:imageId', render: @renderViewerForTrainingImage}
          h Route, {path: '/view-training/:imageId', render: @renderViewerForTrainingImage}
          h Route, {path: '/view-results/:imageId', render: @renderViewerForResultImage}
          h Route, {path: '/action/:role', render: @renderUI}
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
