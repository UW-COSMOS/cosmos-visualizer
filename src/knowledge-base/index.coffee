import h from 'react-hyperscript'
import {Component} from 'react'
import {StatefulComponent, APIContext, APIResultView} from '@macrostrat/ui-components'
import './main.styl'

class KnowledgeBaseFilterView extends Component
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      doc_ids: []
      types: []
      filter: {}
      query: ""
    }

  renderExtractions: (response)=>
    {data} = response
    console.log data
    h 'div.results', data.map (i)->
      src = i.target_img_path.replace "img/", "/kb-images/"
      h 'div', [
        h 'img', {src}
        h 'p', i.target_unicode
        h 'p', i.assoc_unicode
      ]

  render: =>
    {query} = @state
    h 'div#knowledge-base-filter', [
      h 'h1', [
        'COSMOS ',
        h 'span.subtle', 'Knowledge base filter'
      ]
      h APIResultView, {
        route: '/model/extraction'
        params: {query}
      }, @renderExtractions
    ]

  getTypes: ->
    {doc_id} = @state.filter
    types = await get '/model/extraction-type', {doc_id}
    @setState {types}

  componentDidMount: ->
    {get} = @context

    doc_ids = await get '/model/document', {all: true}
    @setState {doc_ids}

  componentDidUpdate: (prevProps, prevState)->
    return if @state.filter.doc_id == prevState.filter.doc_id
    @getTypes()


export {KnowledgeBaseFilterView}
