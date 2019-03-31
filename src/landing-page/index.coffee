import {Component} from 'react'
import h from 'react-hyperscript'
import styled from '@emotion/styled'
import {LinkButton, LinkCard, APIResultView} from '@macrostrat/ui-components'
import {Redirect} from 'react-router-dom'
import {MenuItem, Button, Card, ButtonGroup} from '@blueprintjs/core'
import {BrowserRouter as Router, Route, Link} from 'react-router-dom'

import {InlineNavbar} from '../util'
import {UserRole} from '../enum'
import Info from './info.md'
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
        "This results set contains "
        h R, {id: 'figures'}
        ", "
        h R, {id: 'tables'}
        ", and "
        h R, {id: 'equations'}
        " extracted by the COSMOS model from "
        h R, {id: 'documents'}
        " ("
        h R, {id: 'pages'}
        ")."
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
      h LargeInsetText, [
        h Info
        h ModelInfoBox
        h 'p', "Several interfaces to the COSMOS model and its resulting knowledge base are accessible below:"
      ]
      h 'div.actions', [
        h ButtonGroup, {vertical: true}, [
          h ModelButton, {
            to: "/view-extractions"
            index: 1
            title: "Page-level extractions"
          }, "Regions of interest extracted and classified
              for further knowledge-base processing."
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
      h CreditsText, [
        h Credits
      ]
    ]

export {ResultsLandingPage}

