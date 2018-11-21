import {Component} from 'react'
import h from 'react-hyperscript'

import {APIContext} from './api'
import {UIMain} from './ui-main'

class App extends Component
  @contextType: APIContext
  constructor: (props)->
    super props
    @state = {
      people: null
      person: null
    }

  render: ->
    h 'div.app-main', [
      h UIMain, @props
    ]

export {App}
