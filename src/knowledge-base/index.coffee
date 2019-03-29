import h from 'react-hyperscript'
import {Component} from 'react'
import update from 'immutability-helper'
import {StatefulComponent, APIContext,
        PagedAPIView, APIResultView} from '@macrostrat/ui-components'
import {Link} from 'react-router-dom'
import {InputGroup, Popover, Button, Menu, Position} from '@blueprintjs/core'
import {ModelExtraction} from './model-extraction'
import './main.styl'

class KnowledgeBaseFilterView extends StatefulComponent
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      doc_ids: []
      types: []
      filterParams: {
        query: ""
      }
    }

  renderExtractions: (data)=>
    h 'div.results', data.map (d,i)->
      h ModelExtraction, {d..., index: i}

  render: =>
    {filterParams} = @state
    h 'div#knowledge-base-filter', [
      h 'h1', [
        h Link, {to: '/'}, 'COSMOS'
        " "
        h 'span.subtle', 'Knowledge base filter'
      ]
      @renderSearchbar()
      h PagedAPIView, {
        route: '/model/extraction'
        params: filterParams
        topPagination: true
        bottomPagination: false
      }, @renderExtractions
    ]

  updateQuery: (event)=>
    {value} = event.target
    @updateState {filterParams: {query: {$set: value}}}

  renderSearchbar: ->
    {types} = @state

    menuItems = types.map (d)=>
      onClick = =>
        @updateState {filterParams: {type: {$set: d.id}}}
      h Button, {minimal: true, onClick}, d.name

    onClick = =>
      {type, val...} = @state.filterParams
      @updateState {filterParams: {$set: val}}
    menuItems.push h Button, {minimal: true, onClick}, "All types"


    content = h Menu, menuItems
    position = Position.BOTTOM_RIGHT

    type = @state.filterParams.type or "All types"
    rightElement = h Popover, {content, position}, [
      h Button, {minimal: true, icon: "filter"}, type
    ]

    h InputGroup, {
      leftIcon: 'search'
      placeholder: "Search extractions"
      onChange: @updateQuery
      rightElement
    }

  getTypes: ->
    types = [
      {id: 'Figure', name: 'Figure'},
      {id: 'Table', name: 'Table'},
      {id: 'Equation', name: 'Equation'}
    ]
    @setState {types}

  componentDidMount: ->
    @getTypes()


export {KnowledgeBaseFilterView}
