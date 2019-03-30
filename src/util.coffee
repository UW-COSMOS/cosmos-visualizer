import h from 'react-hyperscript'
import {Navbar} from '@blueprintjs/core'

PageHeader = (props)->
  {children, title, subtitle} = props
  title ?= 'COSMOS'
  h Navbar.Group, [
    h Navbar.Heading, null,  (
      h 'a', {href: '/'}, [
        h 'h1', title
      ]
    )
    h Navbar.Heading, {className: 'subtitle'}, subtitle
    children
  ]

export {PageHeader}
