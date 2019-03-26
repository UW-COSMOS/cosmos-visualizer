import {Component} from 'react'
import h from 'react-hyperscript'

import {BrowserRouter as Router, Route, Redirect, Switch} from 'react-router-dom'

import {APIContext} from './api'
import {AppMode, UserRole} from './enum'
import {LoginForm} from './login-form'
import {ResultsLandingPage} from './results/landing-page'
import {KnowledgeBaseFilterView} from './knowledge-base'
import {ResultsPage} from './results-page'
import {TaggingPage} from './tagging-page'

class App extends Component
  @contextType: APIContext
  @defaultProps: {
    appMode: AppMode.RESULTS
  }
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
    return false if not person? and (
      role == UserRole.TAG or role == UserRole.VALIDATE)
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

    # Go to specific image by default, if set
    {params: {imageId}} = match

    if role == UserRole.TAG and id?
      extraSaveData = {tagger: id}
      subtitleText = "Tag"
    else if role == UserRole.VALIDATE and id?
      extraSaveData = {validator: id}
      nextImageEndpoint = "/image/validate"
      # Tags can be validated even when unchanged
      allowSaveWithoutChanges = true
      subtitleText = "Validate"
    else if role == UserRole.VIEW_TRAINING
      editingEnabled = false
      nextImageEndpoint = "/image/validate"
      subtitleText = "View training data"
    else if role == UserRole.VIEW_RESULTS
      editingEnabled = false
      nextImageEndpoint = "/image/next_prediction"
      subtitleText = "View results"
      permalinkRoute = "/view-results"
      return h ResultsPage, {
        imageRoute
        extraSaveData
        permalinkRoute
        initialImage: imageId
        allowSaveWithoutChanges
        subtitleText
        @props...
      }

    # This is a hack to disable "NEXT" for now
    # on permalinked images
    navigationEnabled
    if imageId?
      navigationEnabled = false

    console.log "Setting up UI with role #{role}"
    console.log "Image id: #{imageId}"
    return h TaggingPage, {
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

  renderHomepage: =>
    if @props.appMode == AppMode.TAGGING
      return @renderLoginForm()
    {role} = @state
    console.log role
    if role? and role == UserRole.VIEW_RESULTS
      return h Redirect, {to: "/action/#{role}"}
    if role? and role == UserRole.VIEW_KNOWLEDGE_BASE
      return h Redirect, {to: "/knowledge-base"}
    h ResultsLandingPage, {setRole: @setRole}

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
    {publicURL} = @props
    h Router, {basename: publicURL}, [
      h 'div.app-main', [
        h Switch, [
          h Route, {path: '/', exact: true, render: @renderHomepage}
          # Legacy route for viewing training data
          h Route, {path: '/view/:imageId', render: @renderUI(UserRole.VIEW_TRAINING)}
          h Route, {path: '/view-training/:imageId', render: @renderUI(UserRole.VIEW_TRAINING)}
          h Route, {path: '/view-results/:imageId', render: @renderUI(UserRole.VIEW_RESULTS)}
          h Route, {
            path: '/knowledge-base'
            render: => h KnowledgeBaseFilterView
          }
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
      role = UserRole.TAG
    @setState {person: item, role}
    localStorage.setItem('person', JSON.stringify(item))

  setRole: (role)=>
    @setState {role}

  componentDidMount: =>
    @context.get("/people/all")
    .then @setupPeople

    p = localStorage.getItem('person')
    return unless p?
    @setState {person: JSON.parse(p)}

export {App}
