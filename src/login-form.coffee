import {Component} from 'react'
import h from 'react-hyperscript'

import {Select} from '@blueprintjs/select'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'
import {InfoButton} from './landing-page/buttons'

import {InlineNavbar} from './util'
import {UserRole} from './enum'

ModeButton = ({mode, rest...})->
  h InfoButton, {to: "/action/#{mode}", rest...}

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

  render: ->
    {people, person} = @props

    h 'div.login-form', [
      h InlineNavbar, {subtitle: "Image tagger"}
      h "h4", "User"
      @renderRoleControl()
      h 'h4', "Action"
      h 'div.actions', [
        h ButtonGroup, {
          vertical: true
        }, [
          h ModeButton, {
            mode: UserRole.VIEW_TRAINING
            title: "View training data"
            disabled: not person?
          }, "View previously tagged images"
          h ModeButton, {
            mode: UserRole.TAG
            title: "Tag"
          }, "Create training data on untagged images"
          h ModeButton, {
            mode: UserRole.VALIDATE
            title: "Validate"
          }, "Validate already-existing tags"
        ]
      ]
    ]

export {LoginForm}
