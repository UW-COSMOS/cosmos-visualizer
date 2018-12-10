import {Component} from 'react'
import h from 'react-hyperscript'

import {Select} from '@blueprintjs/select'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'

import {APIContext} from './api'
import {UIMain} from './ui-main'
import {Role} from './enum'

class LoginForm extends Component
  @defaultProps: {
    setRole: ->
    setPerson: ->
  }

  renderRoleControl: ->
    {person, people, setPerson} = @props
    selectText = "Select a user"
    if person?
      {name: selectText} = person
    h Select, {
      className: 'user-select'
      items: people
      itemPredicate: (query, item)->
        item.name.toLowerCase().includes query.toLowerCase()
      itemRenderer: (t, {handleClick})->
        h MenuItem, {
          key: t.person_id,
          onClick: handleClick
          text: t.name
        }
      onItemSelect: setPerson
    }, [
      h Button, {
        text: selectText
        fill: true
        rightIcon: "double-caret-vertical"
      }
    ]

  renderModeControl: ->
    {setRole, person} = @props
    return null unless person?
    selectRole = (role)=> => setRole(role)

    h 'div.mode-control', [
      h 'h4', "Select a role"
      h ButtonGroup, {fill:true}, [
        h Button, {text: "Tag", onClick: selectRole(Role.TAG)}
        h Button, {text: "Validate", onClick: selectRole(Role.VALIDATE)}
        h Button, {text: "View", onClick: selectRole(Role.VIEW)}
      ]
    ]

  render: ->
    {people, person} = @props
    h Card, {className: 'login-form'}, [
      h 'h3.bp3-heading', 'Image tagger'
      @renderRoleControl()
      @renderModeControl()
    ]

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

  renderUI: ->
    {person, people, role} = @state
    if @allRequiredOptionsAreSet()
      id = person.person_id
      console.log person
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
      else if role == Role.VIEW
        editingEnabled = false
        nextImageEndpoint = "/image/validate"
        subtitleText = "View"

      return h UIMain, {
        extraSaveData
        nextImageEndpoint
        allowSaveWithoutChanges
        editingEnabled
        subtitleText
        @props...
      }
    else if people?
      return h LoginForm, {
        person, people,
        setPerson: @setPerson
        setRole: @setRole
      }
    return null

  render: ->
    h 'div.app-main', [
      @renderUI()
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
