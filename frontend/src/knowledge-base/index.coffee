import h from 'react-hyperscript'
import {Component} from 'react'
import update from 'immutability-helper'
import {StatefulComponent, APIContext,
        PagedAPIView, APIResultView} from '@macrostrat/ui-components'
import {Link} from 'react-router-dom'
import {InputGroup, Popover, Button, Menu,
        Position, Navbar} from '@blueprintjs/core'
import {ModelExtraction} from './model-extraction'
import {debounce} from 'underscore'

import {InlineNavbar} from '../util'
import './main.styl'

class KnowledgeBaseFilterView extends StatefulComponent
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      doc_ids: []
      types: []
      opts: {
        unwrapResponse: (res)->res.success.data[0]
      }
      filterParams: {
        query: ""
      }
    }

  renderExtractions: (data)=>
    {query} = @state.filterParams
    h 'div.results', data.map (d,i)->
      h ModelExtraction, {d..., index: i, query}

  render: =>
    {filterParams} = @state
    filterParams["biomass_filter"] = true
    h 'div#knowledge-base-filter.main', [
      h InlineNavbar, {subtitle: 'Knowledge base filter'}
      @renderSearchbar()
      h PagedAPIView, {
        route: ''
        opts: {
          unwrapResponse: (res)->res.results
        }
        params: filterParams
        topPagination: true
        bottomPagination: false
      }, @renderExtractions
    ]

  updateQuery: (value)=>
    @updateState {filterParams: {query: {$set: value}}}

  renderSearchbar: ->
    {types} = @state

    menuItems = types.map (d)=>
      onClick = =>
        @updateState {filterParams: {type: {$set: d.id}}}
      h Menu.Item, {onClick, text: d.name}

    onClick = =>
      {type, val...} = @state.filterParams
      @updateState {filterParams: {$set: val}}
    menuItems.push h Menu.Divider
    menuItems.push h Menu.Item, {onClick, text: "All types"}

    content = h Menu, menuItems
    position = Position.BOTTOM_RIGHT

    type = @state.filterParams.type or "All types"
    rightElement = h Popover, {content, position}, [
      h Button, {minimal: true, rightIcon: "filter"}, type
    ]



    updateQuery = debounce(@updateQuery,500)
    onChange = (event)->
      updateQuery(event.target.value)

    h InputGroup, {
      leftIcon: 'search'
      placeholder: "Search extractions"
      onChange
      rightElement
    }

  getTypes: ->
    types = [
      {id: 'Figure', name: 'Figure'},
      {id: 'Figure Caption', name: 'Figure Caption'},
      {id: 'Table', name: 'Table'},
      {id: 'Table Caption', name: 'Table Caption'},
      {id: 'Equation', name: 'Equation'},
      {id: 'Code', name: 'Code'},
      {id: 'Body Text', name: 'Body Text'},
      {id: 'Reference text', name: 'Reference text'},
      {id: 'Other', name: 'Other'},
      {id: 'Page Header', name: 'Page Header'},
      {id: 'Page Footer', name: 'Page Footer'},
      {id: 'Section Header', name: 'Section Header'}
    ]
    @setState {types}

  componentDidMount: ->
    @getTypes()


export {KnowledgeBaseFilterView}
