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
        btype: null
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
        @updateState {filterParams: {btype: {$set: d.id}}}
      h Button, {minimal: true, onClick}, d.name


    content = h Menu, menuItems
    position = Position.BOTTOM_RIGHT

    type = @state.filterParams.btype or "All types"
    rightElement = h Popover, {content, position}, [
      h Button, {minimal: true, icon: "filter"}, types
    ]

    h InputGroup, {
      leftIcon: 'search'
      placeholder: "Search extractions"
      onChange: @updateQuery
      rightElement
    }

  getTypes: ->
    types = await get '/model/extraction-type', {all: true}
    console.log types
    @setState {types}

  componentDidMount: ->
    @getTypes()


export {KnowledgeBaseFilterView}
