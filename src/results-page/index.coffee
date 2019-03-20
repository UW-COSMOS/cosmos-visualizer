import h from 'react-hyperscript'
import {Component} from 'react'
import {TaggingPage} from '../tagging-page'

class ResultsPage extends Component
  render: ->
    h TaggingPage, {
      editingEnabled: false
      nextImageEndpoint: '/image/next_prediction'
      subtitleText: "View results"
      permalinkRoute: "/view-results"
      navigationEnabled: true
      @props...
    }

export {ResultsPage}
