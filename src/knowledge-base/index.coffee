import h from 'react-hyperscript'
import {Component} from 'react'
import {APIContext, APIResultsView} from '@macrostrat/ui-components'
import './main.styl'

class KnowledgeBaseFilterView extends Component
  @contextType: APIContext
  render: ->
    h 'div#knowledge-base-filter', [
      h 'h1', [
        'COSMOS ',
        h 'span.subtle', 'Knowledge base filter'
      ]
      h APIResultView, {
        route: '/model/document'
        params: {all: true}
      }
    ]

export {KnowledgeBaseFilterView}
