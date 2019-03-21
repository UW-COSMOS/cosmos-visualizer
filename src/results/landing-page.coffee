import {Component} from 'react'
import h from 'react-hyperscript'
import Info from './info.md'

import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'

import {UserRole} from '../enum'

class ResultsLandingPage extends Component
  @defaultProps: {
    setRole: ->
  }

  render: ->
    {setRole} = @props
    selectRole = (role)=> => setRole(role)

    h Card, {className: 'results-landing-page'}, [
      h 'h2.bp3-heading', [
        'COSMOS ',
        h 'span.subtle', "Model Results"
      ]
      h Info
      h 'div.actions', [
        h ButtonGroup, {vertical: true}, [
          h Button, {
            large: true,
            text: "Page-level extractions",
            onClick: selectRole(UserRole.VIEW_RESULTS)
          }
          h Button, {
            large: true,
            text: "Searchable corpus",
            onClick: selectRole(UserRole.VIEW_TRAINING)
          }

        ]
      ]
    ]

export {ResultsLandingPage}

