import {Component} from 'react'
import h from 'react-hyperscript'

import {Select} from '@blueprintjs/select'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'

import {APIContext} from './api'
import {UIMain} from './ui-main'
import {Role} from './enum'

class App extends Component
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      people: null
      person: null
      role: null
    }

  renderModeControl: ->
    return null unless @state.person?
    selectRole = (role)=> =>
      @setState {role}

    h 'div.mode-control', [
      h 'h4', "Select a role"
      h ButtonGroup, {fill:true}, [
        h Button, {text: "Tag", onClick: selectRole(Role.TAG)}
        h Button, {text: "Validate", onClick: selectRole(Role.VALIDATE)}
      ]
    ]

  renderLoginForm: ->
    {people, person} = @state
    selectText = "Select a user"
    if person?
      {name: selectText} = person

    h Card, {className: 'login-form'}, [
      h 'h3.bp3-heading', 'Image tagger'
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
        onItemSelect: @setPerson
      }, [
        h Button, {
          text: selectText
          fill: true
          rightIcon: "double-caret-vertical"
        }
      ]
      @renderModeControl()
    ]

  allRequiredOptionsAreSet: =>
    console.log @state
    return false unless @state.person?
    return false unless @state.role?
    return true

  renderUI: ->
    {person, people} = @state
    if @allRequiredOptionsAreSet()
      return h UIMain, @props
    else if people?
      return @renderLoginForm()
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

  componentDidMount: ->
    @context.get("/people/all")
      .then @setupPeople

export {App}
