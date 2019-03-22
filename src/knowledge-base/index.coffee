import h from 'react-hyperscript'
import {Component} from 'react'
import {APIResultsView} from '@macrostrat/ui-components'
import './main.styl'

class KnowledgeBaseFilterView extends Component
  render: ->
    h 'div#knowledge-base-filter', [
      h 'h1', [
        'COSMOS ',
        h 'span.subtle', 'Knowledge base filter'
      ]
    ]

export {KnowledgeBaseFilterView}
