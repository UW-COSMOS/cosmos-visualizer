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
    }

  allRequiredOptionsAreSet: (role)=>
    {person} = @state
    return false unless role?
    # Doesn't matter what privileges we have to view tags
    return true if role == UserRole.VIEW_TRAINING
    # We should have a person if another option is required
    return false unless person?
    if role == UserRole.TAG
      return person.tagger
    if role == UserRole.VALIDATE
      return person.validator
    return false

  renderUI: ({match, role})=>

    # Go to specific image by default, if set
    {params: {role: newRole, imageId}} = match
    {person} = @state
    # Allow role to be overridden by programmatically
    # set one (to support permalinks)
    role ?= newRole

    if not @allRequiredOptionsAreSet(role)
      return h Redirect, {to: '/'}

    imageRoute = "/image"

    id = null
    if person?
      id = person.person_id
    extraSaveData = null
    nextImageEndpoint = "/image/next"
    permalinkRoute = "/view-training"
    allowSaveWithoutChanges = false
    editingEnabled = true

    if role == UserRole.TAG and id?
      extraSaveData = {tagger: id}
      subtitleText = "Tag"
    if role == UserRole.VIEW_TRAINING
      editingEnabled = false
      nextImageEndpoint = "/image/validate"
      allowSaveWithoutChanges = false
      subtitleText = "View training data"
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

  renderLoginForm: =>
    {person, people} = @state
    return null unless people?
    h LoginForm, {
      person, people,
      setPerson: @setPerson
    }

  render: ->
    {publicURL} = @props
    h Router, {basename: publicURL}, [
      h 'div.app-main', [
        h Switch, [
          h Route, {
            path: '/',
            exact: true,
            render: @renderLoginForm
          }
          # Legacy route for viewing training data
          h Route, {
            path: '/view-training/:imageId',
            render: (props)=>
              role = UserRole.VIEW_TRAINING
              @renderUI({role, props...})
          }
          h Route, {path: '/action/:role', render: @renderUI}
        ]
      ]
    ]

  setupPeople: (d)=>
    @setState {people: d}

  setPerson: (person)=>
    @setState {person}
    localStorage.setItem('person', JSON.stringify(person))

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

export {App, TaggingApplication}
