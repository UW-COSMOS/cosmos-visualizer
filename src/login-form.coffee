import {Component} from 'react'
import h from 'react-hyperscript'

import {Select} from '@blueprintjs/select'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'

import {UserRole} from './enum'

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
        h Button, {text: "Tag", onClick: selectRole(UserRole.TAG)}
        h Button, {text: "Validate", onClick: selectRole(UserRole.VALIDATE)}
      ]
    ]

  render: ->
    {setRole, people, person} = @props
    selectRole = (role)=> => setRole(role)

    h Card, {className: 'login-form'}, [
      h 'h3.bp3-heading', 'Image tagger'
      h ButtonGroup, {fill: true}, [
        h Button, {text: "View training data", onClick: selectRole(UserRole.VIEW_TRAINING)}
        h Button, {text: "View results", onClick: selectRole(UserRole.VIEW_RESULTS)}
      ]
      h "h4", "Select a user to edit"
      @renderRoleControl()
      @renderModeControl()
    ]

export {LoginForm}
