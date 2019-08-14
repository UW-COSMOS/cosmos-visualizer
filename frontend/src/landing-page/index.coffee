import {Component} from 'react'
import h from 'react-hyperscript'
import styled from '@emotion/styled'
import {LinkButton, LinkCard, APIResultView} from '@macrostrat/ui-components'
import {Redirect} from 'react-router-dom'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'

import {InfoButton} from './components'
import {InlineNavbar} from '../util'
import {UserRole} from '../enum'
import Credits from './credits.md'

InsetText = styled.div"""
  padding: 0 0.2em;
"""

LargeInsetText = styled(InsetText)"""
  font-size: 1.2em;
"""

CreditsText = styled(InsetText)"""
  margin-top: 2em;
  color: #888;
  font-size: 0.8em;
  ul {
    padding-left: 1em;
  }
"""

ModelInfo = styled.div"""
  span.res {
    font-style: italic;
  }
"""

Res = ({data, id})->
  val = "–"
  if data?
    val = data[id]
  h 'span.res', [
    h 'span.value', val
    " #{id}"
  ]

ModelInfoBox = ->
  res = h APIResultView, {
    route: "/model/info"
    params: {stack_id: "default"}
    placeholder: null
  }, (data)=>
    R = ({id})-> h Res, {data, id}
    h ModelInfo, [
      h 'p', [
        "This instance of "
        h 'b', "COSMOS Visualizer"
        " exposes a knowledge base covering "
        h R, {id: 'documents'}
        " ("
        h R, {id: 'pages'}
        ")"
        " assembled by the "
        h 'b', "COSMOS"
        " pipeline. "
        "Several interfaces to the extractions and knowledge base are accessible below:"
      ]
    ]


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
      h 'div.actions', [
        h ButtonGroup, {vertical: true}, [
          h InfoButton, {
            to: "/view-extractions"
            index: 1
            title: "Page-level extractions"
          }, "Regions of interest extracted and classified
              for further knowledge-base processing."
          h InfoButton, {
            to: "/view-results"
            index: 2
            title: "Model entity extractions",
          }, "Model entities (equations, constituent variables defined in text,
              and semantically linked explanatory phrases) shown at a page level."
          h InfoButton, {
            index: 3
            title: "Searchable knowledge base",
            to: "/knowledge-base"
          }, "Knowledge base of equations, figures, and tables extracted from page-level
              information and searchable based on contextual information linked by the model."
        ]
      ]
      h CreditsText, [
        h 'div', {dangerouslySetInnerHTML: {__html: Credits}}
      ]
    ]

export {ResultsLandingPage}
