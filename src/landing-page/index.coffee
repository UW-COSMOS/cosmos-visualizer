import {Component} from 'react'
import h from 'react-hyperscript'
import styled from '@emotion/styled'
import {LinkButton, LinkCard} from '@macrostrat/ui-components'
import {Redirect} from 'react-router-dom'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'

import {InlineNavbar} from '../util'
import {UserRole} from '../enum'
import Info from './info.md'


LargeInsetText = styled.div"""
  font-size: 1.2em;
  padding: 0 0.2em;
"""

ModelButton_ = (props)->
  {index, to, title, children, rest...} = props
  if index?
    index = h 'span.index', "#{index}. "
  h LinkButton, {to, large: true, rest...}, [
    h 'h3', [
      index
      title
    ]
    h 'p', children
  ]

ModelButton = styled(ModelButton_)"""
  .bp3-button-text {
    display: block;
    text-align: left;
  }
  h3 {
    color: #444;
    margin-bottom: 0.5em;
    margin-top: 0.5em;
  }
  span.index {
    color: #888;
  }
  p {
    font-size 0.9em;
    color: #666;
  }
"""


class ResultsLandingPage extends Component
  @defaultProps: {
    setRole: ->
  }

  render: ->
    {setRole} = @props
    selectRole = (role)=> =>
      console.log "Selected role #{role}"
      setRole(role)

    h 'div', {className: 'results-landing-page'}, [
      h InlineNavbar, {subtitle: "Model results"}
      h LargeInsetText, [
        h Info
      ]
      h 'div.actions', [
        h ButtonGroup, {vertical: true}, [
          h ModelButton, {
            to: "/view-extractions"
            index: 1
            title: "Page-level extractions"
          }, "Regions of interest extracted and classified
              for further knowledge-base processing"
          h ModelButton, {
            to: "/view-results"
            index: 2
            title: "Model entity extractions",
          }, "Model entities (equations, constituent variables defined in text,
              and semantically linked explanatory phrases) shown at a page level."
          h ModelButton, {
            index: 3
            title: "Searchable knowledge base",
            to: "/knowledge-base"
          }, "Knowledge base of equations, figures, and tables extracted from page-level
              information and searchable based on contextual information linked by the model."
        ]
      ]
    ]

export {ResultsLandingPage}

