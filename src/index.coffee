import 'babel-polyfill' # Helps with building

import "@blueprintjs/core/lib/css/blueprint.css"
import "@blueprintjs/icons/lib/css/blueprint-icons.css"
import "@blueprintjs/select/lib/css/blueprint-select.css"
import './main.styl'

import {render} from 'react-dom'
import h from 'react-hyperscript'
import {FocusStyleManager} from "@blueprintjs/core"
import {App} from './app'
import {APIProvider} from './api'

FocusStyleManager.onlyShowFocusOnTabs()

AppHolder = (props)=>
  {baseURL, rest...} = props

  h APIProvider, {baseURL}, [
    h App, {rest...}
  ]

window.createUI = (opts={})->
  {baseURL, imageBaseURL, publicURL} = opts

  try
    # Attempt to set parameters from environment variables
    # This will fail if bundled on a different system, presumably,
    # so we wrap in try/catch.
    publicURL ?= process.env.PUBLIC_URL
    baseURL ?= process.env.API_BASE_URL
    imageBaseURL ?= process.env.IMAGE_BASE_URL
  catch {}

  # Set reasonable defaults
  publicURL ?= "/"
  baseURL ?= "https://dev.macrostrat.org/image-tagger-api"
  imageBaseURL ?= "https://dev.macrostrat.org/image-tagger/img/"

  el = document.getElementById('app')
  __ = h AppHolder, {baseURL, imageBaseURL, publicURL}
  render __, el
