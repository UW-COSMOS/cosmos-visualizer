import {Component, createContext, useContext} from 'react'
import h from 'react-hyperscript'
import {Link, Route, withRouter} from 'react-router-dom'
import {Navbar} from '@blueprintjs/core'
import {LinkButton} from '@macrostrat/ui-components'
import T from 'prop-types'
import {AppMode} from './enum'
import {ImageShape} from './types'

PermalinkContext = createContext {}

class PermalinkProvider extends Component
  @propTypes: {
    appMode: T.oneOf([AppMode.ANNOTATION, AppMode.PREDICTION])
  }

  permalinkTo: ({stack_id, image_id})=>
    {pageTemplate} = @getValue()
    pageTemplate
      .replace(":stackId",stack_id)
      .replace(":imageId",image_id)

  getValue: ->
    {appMode} = @props
    {permalinkTo} = @
    pageTemplate = "/#{appMode}/:stackId/page/:imageId"
    return {appMode, pageTemplate, permalinkTo}

  render: ->
    {appMode, rest...} = @props
    value = @getValue()
    h PermalinkContext.Provider, {value, rest...}

PermalinkButton = withRouter (props)->
  ctx = useContext(PermalinkContext)
  {permalinkRoute, image, match} = props
  {params: {imageId, stackId}} = match
  return null unless image?
  {image_id, stack_id} = image
  text = "Permalink"
  disabled = false

  console.log imageId, stackId, match
  if image_id == imageId and stack_id == stackId
    # We are at the permalink right now
    disabled = true
    text = [h('span', [text, " to image "]), h('code', image_id)]
  h LinkButton, {
    icon: 'bookmark'
    to: ctx.permalinkTo({stack_id, image_id})
    disabled
    text
  }

PermalinkButton.propTypes = {
  image: ImageShape
}

PermalinkRoute = (props)->
  ctx = useContext(PermalinkContext)
  path = ctx.pageTemplate
  h Route, {props..., path}

export {PermalinkButton, PermalinkProvider, PermalinkRoute, PermalinkContext}
