import h from 'react-hyperscript'
import styled from '@emotion/styled'
import {LinkButton} from '@macrostrat/ui-components'

InfoButton_ = (props)->
  {index, to, title, children, rest...} = props
  if index?
    index = h 'span.index', "#{index}. "
  h LinkButton, {to, large: true, rest...}, [
    h 'h3', [
      index
      title
    ]
    h 'p', children
  ]

InfoButton = styled(InfoButton_)"""
  .bp3-button-text {
    display: block;
    text-align: left;
    width: 100%;
  }
  h3 {
    color: #444;
    margin-bottom: 0.5em;
    margin-top: 0.5em;
  }
  span.index {
    color: #888;
  }
  p {
    font-size 0.9em;
    color: #666;
  }
"""

export {InfoButton}
