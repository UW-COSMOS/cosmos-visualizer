import {Component} from 'react'
import h from 'react-hyperscript'

import {BrowserRouter as Router, Route, Redirect, Switch} from 'react-router-dom'

import {APIContext} from './api'
import {AppMode, UserRole} from './enum'
import {LoginForm} from './login-form'
import {ResultsLandingPage} from './landing-page'
import {KnowledgeBaseFilterView} from './knowledge-base'
import {ResultsPage} from './results-page'
import {TaggingPage} from './tagging-page'

class TaggingApplication extends Component
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
    if role? and role == UserRole.VIEW_EXTRACTIONS
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
          h Route, {
            path: '/',
            exact: true,
            render: @renderHomepage
          }
          # Legacy route for viewing training data
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

ViewerPage = ({match, rest...})=>
  # Go to specific image by default, if set
  {params: {imageId}} = match

  # This is a hack to disable "NEXT" for now
  # on permalinked images
  if imageId? and not rest.navigationEnabled?
    rest.navigationEnabled = false

  return h TaggingPage, {
    initialImage: imageId
    allowSaveWithoutChanges: false
    editingEnabled: false
    rest...
  }

ViewResults = ({match, rest...})=>
  # Go to specific image by default, if set
  {params: {imageId}} = match

  # This is a hack to disable "NEXT" for now
  # on permalinked images
  if imageId? and not rest.navigationEnabled?
    rest.navigationEnabled = false

  return h ResultsPage, {
    imageRoute: '/image'
    permalinkRoute: '/view-results'
    subtitleText: "View results"
    nextImageEndpoint: '/image/next_eqn_prediction'
    match...
  }

class App extends Component
  @contextType: APIContext
  @defaultProps: {
    appMode: AppMode.RESULTS
  }
  render: ->
    {publicURL} = @props
    h Router, {basename: publicURL}, [
      h 'div.app-main', [
        h Switch, [
          h Route, {
            path: '/',
            exact: true,
            component: ResultsLandingPage
          }
          h Route, {
            path: '/view-training/:imageId?',
            render: (props)=>
              h ViewerPage, {
                permalinkRoute: "/view-training"
                nextImageEndpoint: "/image/validate"
                subtitleText: "View training data"
                props...
              }
          }
          h Route, {
            path: '/view-extractions/:imageId?',
            render: (props)=>
              h ViewerPage, {
                nextImageEndpoint: "/image/next_prediction"
                subtitleText: "View extractions"
                permalinkRoute: "/view-extractions"
                props...
              }
          }
          h Route, {
            path: '/view-results/:imageId?',
            component: ViewResults
          }
          h Route, {
            path: '/knowledge-base'
            component: KnowledgeBaseFilterView
          }
        ]
      ]
    ]

export {App}
