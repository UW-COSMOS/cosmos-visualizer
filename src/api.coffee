import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import {json} from 'd3-fetch'
import {AppToaster} from './toaster'
import {Intent} from '@blueprintjs/core'
import {
  APIContext,
  APIConsumer,
  APIProvider
} from '@macrostrat/ui-components'

ErrorMessage = (props)=>
  {title, error, method, endpoint, data} = props
  method ?= 'GET'
  title ?= 'API error'

  message = h 'div.error-toast', [
    h 'h4', title
    h 'div.details', [
      h 'div.error-message', error
      h 'div', [
        h 'code', method
        " to endpoint "
        h 'code', endpoint
        " failed."
      ]
      if data then h "pre", JSON.stringify(data, null, 2) else null
    ]
  ]

  {message, intent: Intent.DANGER}

class APIProviderShim extends Component
  @defaultProps: {
    baseURL: null
  }
  constructor: (props)->
    super props

  onError: (route, opts)->
    {error} = opts
    AppToaster.show ErrorMessage {
      title: "Invalid API response."
      method: 'GET'
      endpoint: route
      message: error.toString()
    }

  render: ->
    {children, baseURL} = @props
    {onError} = @
    h APIProvider, {
      baseURL,
      onError,
      unwrapResponse: (res)->res.data
      children
    }

export {
  APIProviderShim as APIProvider,
  APIConsumer,
  APIContext,
  ErrorMessage
}
