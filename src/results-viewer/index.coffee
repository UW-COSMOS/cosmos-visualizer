import h from 'react-hyperscript'
import {Component} from 'react'
import {UIMain} from '../ui-main'

class ResultsViewer extends Component
  render: ->
    h UIMain, {
      editingEnabled: false
      nextImageEndpoint: '/image/next_prediction'
      subtitleText: "View results"
      permalinkRoute: "/view-results"
      navigationEnabled: true
      @props...
    }

export {ResultsViewer}
