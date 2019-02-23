import {Component} from 'react'
import h from 'react-hyperscript'
import classNames from 'classnames'
import styled from '@emotion/styled'
import {Omnibar} from '@blueprintjs/select'
import Fuse from 'fuse.js'
import chroma from 'chroma-js'

ListItem = (props)->
  {active, className, onClick, d...} = props
  console.log d
  className = classNames {active}, className
  color = chroma d.color
  l = if active then 0.5 else 0.95
  light = color.set('hsl.l', l)
  _ = if active then 0.95 else 0.5
  dark = color.set('hsl.l', _)
  h 'div.tag-item-container', {
    key: d.id,
    className, onClick
    style: {backgroundColor: light.css(), color: dark.css()}
  }, [
    h 'div.tag-item', {}, d.name
  ]

class TypeSelector extends Component
  render: ->
    options = {
      shouldSort: true,
      minMatchCharLength: 0,
      keys: ["name", "description"]
    }
    fuse = null
    {tags, onItemSelect, rest...} = @props

    h Omnibar, {
      rest...
      onItemSelect
      items: tags
      resetOnSelect: true
      itemListRenderer: (obj)=>
        {filteredItems, activeItem} = obj
        h 'div.item-list', null, filteredItems.map (d)=>
          active = d == activeItem
          onClick = =>
            onItemSelect(d)
          h ListItem, {active, onClick, d...}

      itemListPredicate: (query, items)->
        return items if query == ""
        if not fuse?
          fuse = new Fuse(items, options)
        fuse.search(query)
    }

export {TypeSelector}
