import 'babel-polyfill' # Helps with building

import "@blueprintjs/core/lib/css/blueprint.css"
import "@blueprintjs/icons/lib/css/blueprint-icons.css"
import "@blueprintjs/select/lib/css/blueprint-select.css"
import './main.styl'

import {render} from 'react-dom'
import h from 'react-hyperscript'
import {FocusStyleManager} from "@blueprintjs/core"
import {UIMain} from './ui-main'
import {APIProvider} from './api'

FocusStyleManager.onlyShowFocusOnTabs()

AppHolder = (props)=>
  {baseURL, rest...} = props
  h APIProvider, {baseURL}, [
    h UIMain, rest
  ]

window.createUI = (opts={})->
  {baseURL, imageBaseURL} = opts
  el = document.getElementById('app')
  __ = h AppHolder, {baseURL, imageBaseURL}
  render __, el
