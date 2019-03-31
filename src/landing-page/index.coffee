import {Component} from 'react'
import h from 'react-hyperscript'
import {LinkButton} from '@macrostrat/ui-components'
import {Redirect} from 'react-router-dom'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'

import {UserRole} from '../enum'
import Info from './info.md'

class ResultsLandingPage extends Component
  @defaultProps: {
    setRole: ->
  }

  render: ->
    {setRole} = @props
    selectRole = (role)=> =>
      console.log "Selected role #{role}"
      setRole(role)

    h Card, {className: 'results-landing-page'}, [
      h 'h2.bp3-heading', [
        'COSMOS ',
        h 'span.subtle', "Model Results"
      ]
      h Info
      h 'div.actions', [
        h ButtonGroup, {vertical: true}, [
          h LinkButton, {
            to: "/view-extractions"
            large: true
            text: "Bounding box extractions"
          }
          h LinkButton, {
            large: true,
            to: "/view-results"
            text: "Model entity extractions",
          }
          h LinkButton, {
            large: true,
            text: "Searchable knowledge base",
            to: "/knowledge-base"
          }
        ]
      ]
    ]

export {ResultsLandingPage}

