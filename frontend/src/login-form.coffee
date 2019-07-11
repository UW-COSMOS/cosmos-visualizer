import {Component} from 'react'
import h from 'react-hyperscript'
import styled from '@emotion/styled'

import {Select} from '@blueprintjs/select'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'
import {InfoButton} from './landing-page/components'

import {InlineNavbar} from './util'
import {UserRole} from './enum'

ModeButton = ({mode, rest...})->
  h InfoButton, {to: "/action/#{mode}", rest...}

RoleContainer = styled.div"""
display: flex;
flex-direction: row;
.user-select {
  flex-grow: 1;
  margin-right: 0.2em;
}
"""

RoleControl = ({person, people, setPerson, props...})->
  h RoleContainer, props, [
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
        text: if person? then person.name else "Select a user"
        fill: true
        large: true
        rightIcon: "double-caret-vertical"
      }
    ]
    h Button, {
      icon: 'cross'
      large: true
      disabled: not person?
      onClick: =>
        setPerson(null)
    }
  ]

class LoginForm extends Component
  @defaultProps: {
    setRole: ->
    setPerson: ->
  }

  renderModeControl: ->
    {setRole, person} = @props
    return null unless person?

  render: ->
    {people, person, setPerson} = @props

    h 'div.login-form', [
      h InlineNavbar, {subtitle: "Image tagger"}
      h "h3", "User"
      h RoleControl, {people, person, setPerson}
      h 'h3', "Action"
      h 'div.actions', [
        h ButtonGroup, {
          vertical: true
        }, [
          h ModeButton, {
            mode: UserRole.VIEW_TRAINING
            title: "View training data"
          }, "View previously tagged images"
          h ModeButton, {
            mode: UserRole.TAG
            title: "Tag"
            disabled: not person? or not person.tagger
          }, "Create training data on untagged images"
          h ModeButton, {
            mode: UserRole.VALIDATE
            title: "Validate"
            disabled: not person? or not person.validator
          }, "Validate already-existing tags"
        ]
      ]
    ]

export {LoginForm}
