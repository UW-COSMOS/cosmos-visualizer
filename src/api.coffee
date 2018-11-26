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
      "/image/next": "test/image.json"
      "/tags": "test/tags.json"
      "/image/pazzaglia_brandon_1996_p6/tags": "test/rectangles.json"
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
    endpoint = "/image/#{image.image_id}/tags"
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
            h 'div.error-message', err
            h 'div', [
              h 'code', "POST"
              " to endpoint "
              h 'code', endpoint
              " failed."
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

  get: (spec)=>
    uri = @endpointFor spec
    console.log "#{uri} [GET]"
    {data} = await json uri
    if not data?
      throw "Invalid API response."
    return data

  post: (spec, data)=>
    uri = @endpointFor(spec)
    console.log "#{uri} [POST]", data
    res = await json(uri, {
      method: 'POST',
      headers: {"Content-Type": "application/json; charset=UTF-8"},
      body: JSON.stringify(data)
    })
    {data, error} = res
    if not data?
      throw error or "Invalid API response."
    return data

export {APIProvider, APIConsumer, APIContext}
