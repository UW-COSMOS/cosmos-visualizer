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
  {baseURL, imageBaseURL} = opts

  # Public URL for frontend
  publicURL = process.env.PUBLIC_URL or "/"
  console.log publicURL

  el = document.getElementById('app')
  __ = h AppHolder, {baseURL, imageBaseURL, publicURL}
  render __, el

createUI({
  baseURL: "https://dev.macrostrat.org/image-tagger-api",
  imageBaseURL: "https://dev.macrostrat.org/image-tagger/img/"
})
