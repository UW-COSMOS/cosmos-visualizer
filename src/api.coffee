import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import {json} from 'd3-fetch'

APIContext = createContext({})
APIConsumer = APIContext.Consumer

class APIProvider extends Component
  @defaultProps: {
    baseURL: null
    testEndpoints: {
      "/image": "/test/image.json"
    }
  }
  render: ->
    {children, baseURL} = @props
    functions = do => {endpointFor, get, post} = @
    value = {functions..., baseURL}
    h APIContext.Provider, {value}, children

  endpointFor: (spec)=>
    {baseURL, testEndpoints} = @props
    if not baseURL?
      return testEndpoints[spec]
    return baseURL + spec

  get: (spec)=> json @endpointFor spec

  post: (spec, data)=>
    url = @endpointFor(spec)
    json(url, {
      method: 'POST',
      headers: {"Content-type": "application/json; charset=UTF-8"},
      body: JSON.stringify(query)
    })

export {APIProvider, APIConsumer, APIContext}
