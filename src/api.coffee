import {Component, createContext} from 'react'
import {render} from 'react-dom'
import h from 'react-hyperscript'
import {json} from 'd3-fetch'
import {AppToaster} from './toaster'
import {Intent} from '@blueprintjs/core'

APIContext = createContext({})
APIConsumer = APIContext.Consumer

class APIProvider extends Component
  @defaultProps: {
    baseURL: null
    testEndpoints: {
      "/image": "/test/image.json"
      "/tags": "/test/tags.json"
      "/image/pazzaglia_brandon_1996_p6/tags": "/test/rectangles.json"
    }
  }
  constructor: (props)->
    super props
    if not @props.baseURL
      AppToaster.show {
        message: "No API endpoint specified. Using test routes.",
        intent: Intent.WARNING
      }

  render: ->
    {children, baseURL} = @props
    functions = do => {endpointFor, get, post} = @
    value = {functions..., baseURL}
    h APIContext.Provider, {value}, children

  saveData: (image, tags)=>
    endpoint = "/image/#{image.id}"
    try
      await @post(endpoint, tags)
      AppToaster.show {
        message: "Saved data!"
        intent: Intent.SUCCESS
      }
    catch err
      AppToaster.show {
        message: h 'div.error-toast', [
          h 'h4', "Could not save data"
          h 'div.details', [
            h 'div', [
              h 'code', "POST"
              " to endpoint "
              h 'code', endpoint
              " failed"
            ]
            h "pre", JSON.stringify(tags, null, 2)
          ]
        ]
        intent: Intent.DANGER
      }
      throw err

  endpointFor: (spec)=>
    {baseURL, testEndpoints} = @props
    if not baseURL?
      e = testEndpoints[spec]
      return e if e?
    return (baseURL or "")+spec

  get: (spec)=> json @endpointFor spec

  post: (spec, data)=>
    url = @endpointFor(spec)
    json(url, {
      method: 'POST',
      headers: {"Content-type": "application/json; charset=UTF-8"},
      body: JSON.stringify(data)
    })

export {APIProvider, APIConsumer, APIContext}
