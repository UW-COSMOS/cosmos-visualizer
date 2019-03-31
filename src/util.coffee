import h from 'react-hyperscript'
import styled from '@emotion/styled'

import {Link, withRouter} from 'react-router-dom'
import {Navbar} from '@blueprintjs/core'
import {LinkButton} from '@macrostrat/ui-components'

PageHeader = (props)->
  {children, title, subtitle} = props
  title ?= 'COSMOS'
  h Navbar.Group, [
    h Navbar.Heading, null,  (
      h Link, {to: '/'}, [
        h 'h1', title
      ]
    )
    h Navbar.Heading, {className: 'subtitle'}, subtitle
    children
  ]

PermalinkButton = withRouter (props)->
  {permalinkRoute, image, match} = props
  {params: {imageId}} = match
  return null unless image?
  {image_id} = image
  text = "Permalink"
  disabled = false

  if image_id == imageId
    # We are at the permalink right now
    disabled = true
    text = [h('span', [text, " to image "]), h('code', image_id)]
  h LinkButton, {
    icon: 'bookmark'
    to: "#{permalinkRoute}/#{image_id}"
    disabled
    text
  }

_ = ({subtitle, children, rest...})->
  h Navbar, {rest...}, [
    h PageHeader, {subtitle}
    children
  ]

InlineNavbar = styled(_)"""
  border-radius: 4px;
  margin-bottom: 1em;
  margin-top: 1em;
"""

export {PageHeader, PermalinkButton, InlineNavbar}
